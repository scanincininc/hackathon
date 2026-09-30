/**
 * Everything the plan view needs, in one place: the queue, the current plan,
 * the roster and the KPI roll-up.
 *
 * `refresh()` is called after every commit, because a commitment changes
 * somebody else's options too — that is the whole reason this is a set
 * problem rather than a per-referral one.
 */
import { useCallback, useEffect, useState } from "react";

import type { Plan } from "../../model.ts";
import { getKpi, getPlan, getQueue, getStaff, replan, syncFixture, type Kpi, type QueueRow, type StaffRow } from "../api.ts";

export interface QueueState {
  rows: QueueRow[];
  plan: Plan | undefined;
  roster: Map<string, StaffRow>;
  kpi: Kpi | undefined;
  busy: boolean;
  error: string | undefined;
  refresh: () => Promise<void>;
  sync: () => Promise<void>;
  replanNow: () => Promise<void>;
}

export function useQueue(): QueueState {
  const [rows, setRows] = useState<QueueRow[]>([]);
  const [plan, setPlan] = useState<Plan>();
  const [roster, setRoster] = useState<Map<string, StaffRow>>(new Map());
  const [kpi, setKpi] = useState<Kpi>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const refresh = useCallback(async () => {
    try {
      const [queue, current, staff, metrics] = await Promise.all([
        getQueue(),
        getPlan(),
        getStaff(),
        getKpi(),
      ]);
      setRows(queue);
      setPlan(current);
      setRoster(new Map(staff.map((worker) => [worker.staffId, worker])));
      setKpi(metrics);
      setError(undefined);
    } catch (cause) {
      // Offline is normal here, not exceptional: cached documents still render.
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }, []);

  const run = useCallback(
    async (work: () => Promise<unknown>) => {
      setBusy(true);
      try {
        await work();
        await refresh();
      } finally {
        setBusy(false);
      }
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    rows,
    plan,
    roster,
    kpi,
    busy,
    error,
    refresh,
    sync: () => run(syncFixture),
    replanNow: () => run(replan),
  };
}
