/**
 * The typed edge between the UI and the service. Reads come from SQL over the
 * YORM projections; the only two writes that consume capacity are
 * `assign()` and `decline()`.
 */
import type { Plan, Pin } from "../model.ts";
import type { Commitment, CommitRejection } from "../commit.ts";

export interface QueueRow {
  messageId: string;
  referralId: string | null;
  caseNumber: string | null;
  service: string | null;
  county: string | null;
  requestedStartDate: string | null;
  receivedAt: string | null;
  status: string;
  proposedStaffId: string | null;
  committedStaffId: string | null;
  declineReason: string | null;
  proposedStaffName: string | null;
  outcome: string | null;
  rationale: string[] | null;
  contendedWith: string[] | null;
  runnersUp: { staffId: string; reason: string }[] | null;
  unknowns: string[] | null;
  requiresSupervisorJudgment: boolean | null;
}

export interface StaffRow {
  staffId: string;
  staffName: string;
  role: string;
  education: string;
  countiesServed: string[];
  maxFamiliesDcs: number;
  currentFamiliesAssigned: number;
  languages: string[];
  availability: string[];
  active: boolean;
}

export interface Kpi {
  declines: { week: string; service: string | null; declines: number }[];
  gaps: { outcome: string; service: string | null; count: number }[];
}

export type CommitResponse =
  | { ok: true; commitment: Commitment; idempotent: boolean; plan: Plan }
  | { ok: false; rejection: CommitRejection; plan: Plan };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: { "content-type": "application/json", ...(init?.headers ?? {}) },
  });
  if (!response.ok && response.status !== 409) {
    throw new Error(`${init?.method ?? "GET"} ${path} failed: ${response.status}`);
  }
  return (await response.json()) as T;
}

export const getQueue = (): Promise<QueueRow[]> => request<QueueRow[]>("/api/queue");
export const getStaff = (): Promise<StaffRow[]> => request<StaffRow[]>("/api/staff");
export const getPlan = (): Promise<Plan> => request<Plan>("/api/plan");
export const getKpi = (): Promise<Kpi> => request<Kpi>("/api/kpi");

export const syncFixture = (): Promise<{ fetched: number; created: number; plan: Plan }> =>
  request("/api/sync", { method: "POST" });

export const replan = (): Promise<Plan> => request<Plan>("/api/replan", { method: "POST" });

/** Hypothetical: the server writes nothing and no capacity moves. */
export const scenario = (pins: Pin[]): Promise<Plan> =>
  request<Plan>("/api/plan/scenario", { method: "POST", body: JSON.stringify({ pins }) });

export const assign = (body: {
  messageId: string;
  staffId: string;
  commitKey: string;
  committedBy: string;
}): Promise<CommitResponse> =>
  request<CommitResponse>("/api/assignments", { method: "POST", body: JSON.stringify(body) });

export const decline = (body: {
  messageId: string;
  commitKey: string;
  committedBy: string;
  declineReason: string;
}): Promise<CommitResponse> =>
  request<CommitResponse>("/api/declines", { method: "POST", body: JSON.stringify(body) });

/** One key per attempt, reused across retries, so a flaky phone cannot double-commit. */
export const newCommitKey = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `key-${Date.now()}-${Math.random().toString(16).slice(2)}`;
