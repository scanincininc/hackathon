/**
 * The pipeline: Mailpit → parse → evaluate → **plan the whole set** → one case
 * document per referral. YORM projects those documents into `cases` and
 * `case_decisions`, so the queue and the KPI are a SQL query.
 *
 * Reference data is read back out of SQL rather than off the CSVs, because
 * `staff.current_families_assigned` is the counter the assignment API owns —
 * planning has to see the slots that have actually been consumed.
 */
import { asc } from "drizzle-orm";
import type { BetterSQLite3Database } from "drizzle-orm/better-sqlite3";

import { buildCaseDoc, type CaseDoc } from "./case-doc.ts";
import { evaluate } from "./engine.ts";
import { loadReferralEmails } from "./ingest.ts";
import { parseReferrals } from "./parser.ts";
import { plan, referralKey } from "./planner.ts";
import type {
  Education,
  EngineConfig,
  Pin,
  Plan,
  Referral,
  ServiceMatrix,
  Staff,
} from "./model.ts";
import { cases, services, staff } from "./db/schema.ts";
import type { Yorm } from "@yorm/yjs";

export interface Pipeline {
  db: BetterSQLite3Database;
  yorm: Yorm;
  config: EngineConfig;
}

export const readRoster = (db: BetterSQLite3Database): Staff[] =>
  db
    .select()
    .from(staff)
    .orderBy(asc(staff.staffId))
    .all()
    .map((row) => ({
      staffId: row.staffId,
      staffName: row.staffName,
      education: row.education as Education,
      role: row.role,
      countiesServed: row.countiesServed,
      maxFamiliesDcs: row.maxFamiliesDcs,
      currentFamiliesAssigned: row.currentFamiliesAssigned,
      languages: row.languages,
      availability: row.availability as Staff["availability"],
      active: row.active,
    }));

export const readMatrix = (db: BetterSQLite3Database): ServiceMatrix =>
  new Map(
    db
      .select()
      .from(services)
      .all()
      .map((row) => [
        row.service,
        {
          service: row.service,
          minimumEducation: row.minimumEducation as Education[],
          eligibleRoles: row.eligibleRoles,
        },
      ]),
  );

async function readCase(yorm: Yorm, messageId: string): Promise<CaseDoc | undefined> {
  const session = await yorm.open("Case", messageId);
  const value = session.read() as Partial<CaseDoc> | undefined;
  session.close();
  return value && value.messageId ? (value as CaseDoc) : undefined;
}

async function writeCase(yorm: Yorm, doc: CaseDoc): Promise<void> {
  const session = await yorm.open("Case", doc.messageId);
  await session.write(doc);
  session.close();
}

/** The projection doubles as the case index — `message_id` is the stable key. */
const knownMessageIds = (db: BetterSQLite3Database): string[] =>
  db.select({ messageId: cases.messageId }).from(cases).all().map((row) => row.messageId);

/**
 * Replans every uncommitted case as one set. Committed cases become pins, so
 * their capacity is spent and the planner works around them rather than
 * fighting them.
 */
export async function replan({ db, yorm, config }: Pipeline, extraPins: Pin[] = []): Promise<Plan> {
  const docs: CaseDoc[] = [];
  for (const messageId of knownMessageIds(db)) {
    const doc = await readCase(yorm, messageId);
    if (doc) docs.push(doc);
  }

  const pins: Pin[] = [
    ...docs
      .filter((doc) => doc.commitment !== null)
      .map((doc) => {
        const pin: Pin = { referralId: referralKey(doc.referral) };
        if (doc.commitment?.staffId) pin.staffId = doc.commitment.staffId;
        return pin;
      }),
    ...extraPins,
  ];

  const roster = readRoster(db);
  const matrix = readMatrix(db);
  const result = plan(
    docs.map((doc) => doc.referral),
    roster,
    matrix,
    config,
    pins,
  );

  const byReferral = new Map(result.allocations.map((allocation) => [allocation.referralId, allocation]));
  for (const doc of docs) {
    // A committed case is settled: its document must not be rewritten by a replan.
    if (doc.commitment) continue;
    const allocation = byReferral.get(referralKey(doc.referral));
    if (!allocation) continue;
    const evaluation = evaluate(doc.referral, roster, matrix, config);
    await writeCase(yorm, buildCaseDoc(doc.referral, evaluation, allocation, doc));
  }

  return result;
}

/**
 * A hypothetical plan: same allocator, extra pins, nothing written. This is
 * what powers "if I assign S031 here, what happens to everything else?".
 */
export async function scenario(pipeline: Pipeline, pins: Pin[]): Promise<Plan> {
  const docs: CaseDoc[] = [];
  for (const messageId of knownMessageIds(pipeline.db)) {
    const doc = await readCase(pipeline.yorm, messageId);
    if (doc) docs.push(doc);
  }
  const committed: Pin[] = docs
    .filter((doc) => doc.commitment !== null)
    .map((doc) => {
      const pin: Pin = { referralId: referralKey(doc.referral) };
      if (doc.commitment?.staffId) pin.staffId = doc.commitment.staffId;
      return pin;
    });
  return plan(
    docs.map((doc) => doc.referral),
    readRoster(pipeline.db),
    readMatrix(pipeline.db),
    pipeline.config,
    [...committed, ...pins],
  );
}

export interface SyncResult {
  fetched: number;
  created: number;
  plan: Plan;
}

/**
 * Pulls new mail and replans. Deduped on `message_id`, so re-syncing is safe
 * and creates no duplicates — the demo can be run twice.
 */
export async function sync(
  pipeline: Pipeline,
  referrals?: Referral[],
): Promise<SyncResult> {
  // This demo uses the checked-in synthetic fixture directly. No inbox service
  // or external email connection is needed to populate the queue.
  const incoming = referrals ?? parseReferrals(loadReferralEmails());
  const existing = new Set(knownMessageIds(pipeline.db));
  const roster = readRoster(pipeline.db);
  const matrix = readMatrix(pipeline.db);

  let created = 0;
  for (const referral of incoming) {
    if (existing.has(referral.messageId)) continue;
    created += 1;
    const evaluation = evaluate(referral, roster, matrix, pipeline.config);
    // A placeholder proposal; `replan()` immediately decides the whole set.
    await writeCase(
      pipeline.yorm,
      buildCaseDoc(referral, evaluation, {
        referralId: referralKey(referral),
        outcome: "no_capacity",
        pinned: false,
        contendedWith: [],
        rationale: ["Awaiting the first plan of the queue."],
        runnersUp: [],
        requiresSupervisorJudgment: evaluation.requiresSupervisorJudgment,
      }),
    );
  }

  return { fetched: incoming.length, created, plan: await replan(pipeline) };
}

export { readCase, writeCase };
