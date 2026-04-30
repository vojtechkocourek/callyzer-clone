import type { CallRecord, CallType, Employee } from "./types";

export interface KpiSummary {
  totalCalls: number;
  totalTalkSec: number;
  incoming: number;
  outgoing: number;
  missed: number;
  rejected: number;
  uniqueContacts: number;
  avgDurationSec: number;
}

export function summarize(calls: CallRecord[]): KpiSummary {
  let totalTalkSec = 0;
  const counts: Record<CallType, number> = { incoming: 0, outgoing: 0, missed: 0, rejected: 0 };
  const contacts = new Set<string>();
  for (const c of calls) {
    totalTalkSec += c.durationSec;
    counts[c.type]++;
    contacts.add(c.phoneNumber);
  }
  const totalCalls = calls.length;
  const connected = counts.incoming + counts.outgoing;
  return {
    totalCalls,
    totalTalkSec,
    incoming: counts.incoming,
    outgoing: counts.outgoing,
    missed: counts.missed,
    rejected: counts.rejected,
    uniqueContacts: contacts.size,
    avgDurationSec: connected ? Math.round(totalTalkSec / connected) : 0,
  };
}

export interface DailyPoint {
  date: string; // YYYY-MM-DD
  incoming: number;
  outgoing: number;
  missed: number;
  rejected: number;
  talkMin: number;
}

export function dailySeries(calls: CallRecord[], days = 14, endIso?: string): DailyPoint[] {
  const end = endIso ? new Date(endIso) : new Date();
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end);
    d.setUTCDate(d.getUTCDate() - i);
    const key = d.toISOString().slice(0, 10);
    points.push({ date: key, incoming: 0, outgoing: 0, missed: 0, rejected: 0, talkMin: 0 });
  }
  const idx = new Map(points.map((p, i) => [p.date, i]));
  for (const c of calls) {
    const k = c.startedAt.slice(0, 10);
    const i = idx.get(k);
    if (i === undefined) continue;
    const p = points[i];
    p[c.type]++;
    p.talkMin += c.durationSec / 60;
  }
  for (const p of points) p.talkMin = Math.round(p.talkMin);
  return points;
}

export interface LeaderRow {
  employeeId: string;
  name: string;
  totalCalls: number;
  talkSec: number;
  incoming: number;
  outgoing: number;
  missed: number;
  rejected: number;
  avgDurationSec: number;
}

export function leaderboard(calls: CallRecord[], employees: Employee[]): LeaderRow[] {
  const byEmp = new Map<string, LeaderRow>();
  for (const e of employees) {
    byEmp.set(e.id, {
      employeeId: e.id,
      name: e.name,
      totalCalls: 0,
      talkSec: 0,
      incoming: 0,
      outgoing: 0,
      missed: 0,
      rejected: 0,
      avgDurationSec: 0,
    });
  }
  for (const c of calls) {
    const row = byEmp.get(c.employeeId);
    if (!row) continue;
    row.totalCalls++;
    row.talkSec += c.durationSec;
    if (c.type === "incoming") row.incoming++;
    else if (c.type === "outgoing") row.outgoing++;
    else if (c.type === "missed") row.missed++;
    else if (c.type === "rejected") row.rejected++;
  }
  // Compute averages from connected (incoming + outgoing) calls only.
  for (const r of byEmp.values()) {
    const connected = r.incoming + r.outgoing;
    r.avgDurationSec = connected > 0 ? Math.round(r.talkSec / connected) : 0;
  }
  return Array.from(byEmp.values())
    .filter((r) => r.totalCalls > 0)
    .sort((a, b) => b.talkSec - a.talkSec);
}

export function fmtDuration(sec: number): string {
  if (!sec) return "0s";
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}h ${m}m`;
  if (m) return `${m}m ${s}s`;
  return `${s}s`;
}
