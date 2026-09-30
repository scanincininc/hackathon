/**
 * The Hono service: YORM (REST + Yjs WebSocket) at `/yorm`, and the small
 * REST surface the supervisor UI needs at `/api`.
 *
 * The division of labour is deliberate:
 * - **Reads** (`/api/queue`, `/api/kpi`) are SQL over the YORM projections.
 * - **Proposals** are Yjs transactions on the case document — they merge,
 *   work offline, and consume nothing.
 * - **Commitments** are `POST /api/assignments` and `POST /api/declines`, and
 *   nothing else. See `src/commit.ts` for why.
 */
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { createNodeWebSocket } from "@hono/node-ws";
import { createHonoYorm } from "@yorm/hono";
import { createYorm, memoryRuntime } from "@yorm/yjs";
import type { Yorm } from "@yorm/yjs";
import { asc, desc, eq, sql } from "drizzle-orm";
import { Hono } from "hono";
import type { Context } from "hono";
import { fileURLToPath } from "node:url";

import { APP_CONFIG } from "./config.ts";
import { commit, type CommitRequest, type CommitResult } from "./commit.ts";
import { caseDecisions, cases, staff } from "./db/schema.ts";
import { createDatabase, type Database } from "./db/index.ts";
import { importReferenceData } from "./db/import.ts";
import { caseMapping } from "./db/mapping.ts";
import { readCase, replan, scenario, sync, writeCase, type Pipeline } from "./pipeline.ts";
import type { EngineConfig, Pin } from "./model.ts";

export interface Iris {
  app: Hono;
  pipeline: Pipeline;
  database: Database;
  yorm: Yorm;
  close(): void;
}

/**
 * Persists a server-decided commitment into the case document, so every
 * connected supervisor sees it land live. The API decided; the document only
 * carries the news.
 */
async function broadcastCommitment(pipeline: Pipeline, result: CommitResult, messageId: string): Promise<void> {
  const doc = await readCase(pipeline.yorm, messageId);
  if (!doc) return;
  if (result.ok) {
    const { commitment } = result;
    await writeCase(pipeline.yorm, {
      ...doc,
      needsReDecision: null,
      commitment: {
        status: commitment.status,
        ...(commitment.staffId ? { staffId: commitment.staffId } : {}),
        ...(commitment.declineReason ? { declineReason: commitment.declineReason } : {}),
        committedBy: commitment.committedBy,
        committedAt: commitment.committedAt,
        commitKey: commitment.commitKey,
      },
    });
    return;
  }
  // A rejected commit is never resolved silently in either direction.
  await writeCase(pipeline.yorm, {
    ...doc,
    needsReDecision: { reason: result.rejection.message, at: new Date().toISOString() },
  });
}

export function createIris(options: { file?: string; config?: EngineConfig } = {}): Iris {
  const database = createDatabase(options.file);
  importReferenceData(database.db);

  const yorm = createYorm({
    runtime: memoryRuntime(),
    documents: database.adapter.documents,
    projections: database.adapter.projections,
    mappings: [caseMapping],
  });

  const pipeline: Pipeline = {
    db: database.db,
    yorm,
    config: options.config ?? APP_CONFIG.engine,
  };

  const app = new Hono();

  app.get("/api/health", (c) => c.json({ ok: true }));
  app.post("/api/sync", async (c) => c.json(await sync(pipeline)));

  app.get("/api/queue", (c) => {
    const rows = database.db
      .select({
        messageId: cases.messageId,
        referralId: cases.referralId,
        caseNumber: cases.caseNumber,
        service: cases.service,
        county: cases.county,
        requestedStartDate: cases.requestedStartDate,
        receivedAt: cases.receivedAt,
        status: cases.status,
        proposedStaffId: cases.proposedStaffId,
        committedStaffId: cases.committedStaffId,
        declineReason: cases.declineReason,
        proposedStaffName: staff.staffName,
        outcome: caseDecisions.outcome,
        rationale: caseDecisions.rationale,
        contendedWith: caseDecisions.contendedWith,
        runnersUp: caseDecisions.runnersUp,
        unknowns: caseDecisions.unknowns,
        requiresSupervisorJudgment: caseDecisions.requiresSupervisorJudgment,
      })
      .from(cases)
      .leftJoin(caseDecisions, eq(caseDecisions.messageId, cases.messageId))
      .leftJoin(staff, eq(staff.staffId, cases.proposedStaffId))
      .orderBy(asc(cases.requestedStartDate), asc(cases.referralId))
      .all();
    return c.json(rows);
  });

  app.get("/api/staff", (c) =>
    c.json(database.db.select().from(staff).orderBy(asc(staff.staffId)).all()),
  );

  app.get("/api/plan", async (c) => c.json(await replan(pipeline)));
  app.post("/api/replan", async (c) => c.json(await replan(pipeline)));

  app.post("/api/plan/scenario", async (c) => {
    const body = await c.req.json<{ pins?: Pin[] }>();
    // Hypothetical only: nothing is written and no capacity moves.
    return c.json(await scenario(pipeline, body.pins ?? []));
  });

  app.get("/api/kpi", (c) => {
    const declines = database.db
      .select({
        week: sql<string>`strftime('%Y-W%W', ${cases.committedAt})`,
        service: cases.service,
        declines: sql<number>`count(*)`,
      })
      .from(cases)
      .where(eq(cases.status, "declined"))
      .groupBy(sql`1`, sql`2`)
      .orderBy(desc(sql`1`))
      .all();

    const gaps = database.db
      .select({
        outcome: caseDecisions.outcome,
        service: cases.service,
        count: sql<number>`count(*)`,
      })
      .from(caseDecisions)
      .innerJoin(cases, eq(cases.messageId, caseDecisions.messageId))
      .groupBy(sql`1`, sql`2`)
      .all();

    return c.json({ declines, gaps });
  });

  const commitRoute = async (c: Context, staffRequired: boolean) => {
    const body = await c.req.json<CommitRequest>();
    if (!body.messageId || !body.commitKey || !body.committedBy) {
      return c.json({ error: "messageId, commitKey and committedBy are required" }, 400);
    }
    if (staffRequired && !body.staffId) {
      return c.json({ error: "staffId is required to assign" }, 400);
    }

    const request: CommitRequest = {
      messageId: body.messageId,
      commitKey: body.commitKey,
      committedBy: body.committedBy,
      ...(staffRequired && body.staffId ? { staffId: body.staffId } : {}),
      ...(body.declineReason ? { declineReason: body.declineReason } : {}),
    };

    const result = commit(database.db, request, pipeline.config);
    await broadcastCommitment(pipeline, result, body.messageId);
    // Freed or consumed slots are reallocated immediately.
    const current = await replan(pipeline);

    return result.ok
      ? c.json({ ...result, plan: current })
      : c.json({ ...result, plan: current }, 409);
  };

  app.post("/api/assignments", (c) => commitRoute(c, true));
  app.post("/api/declines", (c) => commitRoute(c, false));

  return { app, pipeline, database, yorm, close: () => database.close() };
}

/** Started only when this file is the entry point, so tests can import freely. */
if (import.meta.url === `file://${process.argv[1]}`) {
  const iris = createIris();
  // The public demo queue is populated from the checked-in fixture at startup.
  // sync() deduplicates by message ID, so this is safe after service restarts.
  await sync(iris.pipeline);
  const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app: iris.app });
  iris.app.route("/yorm", createHonoYorm(iris.yorm, { upgradeWebSocket }));
  // In production the same Node service serves the Vite build and the API,
  // keeping REST and Yjs WebSocket traffic on one origin. Keep this last so it
  // cannot intercept API or WebSocket routes.
  iris.app.use("*", serveStatic({ root: fileURLToPath(new URL("../dist", import.meta.url)) }));

  const port = Number(process.env["PORT"] ?? 5178);
  const server = serve({ fetch: iris.app.fetch, port }, (info) => {
    console.log(`iris listening on http://localhost:${info.port}`);
  });
  injectWebSocket(server);
}
