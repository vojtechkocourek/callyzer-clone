/**
 * Data access layer. All functions are async and hit Postgres via Drizzle.
 */
import { and, desc, eq, gte, lte, inArray } from "drizzle-orm";
import { requireDb } from "@/db";
import { callFollowups, calls, sessions, teams, users } from "@/db/schema";
import type { CallRecord, CallType, Employee, Team } from "./types";

const dt = (v: Date | string) => (v instanceof Date ? v.toISOString() : v);

function rowToEmployee(r: typeof users.$inferSelect): Employee {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    phone: r.phone,
    role: r.role,
    teamId: r.teamId,
    active: r.active,
    joinedAt: dt(r.joinedAt),
  };
}

function rowToTeam(r: typeof teams.$inferSelect): Team {
  return { id: r.id, name: r.name, branch: r.branch, managerId: r.managerId };
}

function rowToCall(r: typeof calls.$inferSelect): CallRecord {
  return {
    id: r.id,
    employeeId: r.employeeId,
    contactName: r.contactName,
    phoneNumber: r.phoneNumber,
    type: r.type,
    startedAt: dt(r.startedAt),
    durationSec: r.durationSec,
  };
}

// ---------------- Employees ----------------

export async function listEmployees(): Promise<Employee[]> {
  const rows = await requireDb().select().from(users).orderBy(users.name);
  return rows.map(rowToEmployee);
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const r = await requireDb().select().from(users).where(eq(users.id, id)).limit(1);
  return r[0] ? rowToEmployee(r[0]) : null;
}

export async function getUserRowByEmail(email: string) {
  const r = await requireDb()
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return r[0] ?? null;
}

export async function createEmployee(args: {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: "admin" | "manager" | "employee";
  teamId: string | null;
  passwordHash: string;
}): Promise<Employee> {
  const [row] = await requireDb()
    .insert(users)
    .values({
      id: args.id,
      name: args.name,
      email: args.email.toLowerCase(),
      phone: args.phone ?? "",
      role: args.role,
      teamId: args.teamId,
      passwordHash: args.passwordHash,
      active: true,
    })
    .returning();
  return rowToEmployee(row);
}

export async function updateEmployee(
  id: string,
  patch: Partial<{
    name: string;
    email: string;
    phone: string;
    role: "admin" | "manager" | "employee";
    teamId: string | null;
    active: boolean;
    passwordHash: string;
  }>,
): Promise<Employee | null> {
  const [row] = await requireDb()
    .update(users)
    .set({ ...patch, email: patch.email?.toLowerCase() })
    .where(eq(users.id, id))
    .returning();
  return row ? rowToEmployee(row) : null;
}

export async function deleteEmployee(id: string): Promise<void> {
  await requireDb().delete(users).where(eq(users.id, id));
}

// ---------------- Teams ----------------

export async function listTeams(): Promise<Team[]> {
  const rows = await requireDb().select().from(teams).orderBy(teams.name);
  return rows.map(rowToTeam);
}

export async function createTeam(args: {
  id: string;
  name: string;
  branch?: string;
  managerId?: string | null;
}): Promise<Team> {
  const [row] = await requireDb()
    .insert(teams)
    .values({
      id: args.id,
      name: args.name,
      branch: args.branch ?? "",
      managerId: args.managerId ?? null,
    })
    .returning();
  return rowToTeam(row);
}

// ---------------- Calls ----------------

export interface CallFilter {
  employeeId?: string;
  type?: CallType;
  from?: string; // ISO
  to?: string;   // ISO
  employeeIds?: string[];
  limit?: number;
}


// Treat a date input as the start of that day in UTC (00:00:00.000Z).
function parseFromDate(v: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + "T00:00:00.000Z");
  return new Date(v);
}

// Treat a date input as the end of that day in UTC (23:59:59.999Z), so
// the picker's "To = 30.04" includes everything that happened that day.
function parseToDate(v: string): Date {
  if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return new Date(v + "T23:59:59.999Z");
  return new Date(v);
}

export async function listCalls(filter: CallFilter = {}): Promise<CallRecord[]> {
  const conds = [];
  if (filter.employeeId) conds.push(eq(calls.employeeId, filter.employeeId));
  if (filter.type) conds.push(eq(calls.type, filter.type));
  if (filter.from) conds.push(gte(calls.startedAt, parseFromDate(filter.from)));
  if (filter.to) conds.push(lte(calls.startedAt, parseToDate(filter.to)));
  if (filter.employeeIds && filter.employeeIds.length > 0) {
    conds.push(inArray(calls.employeeId, filter.employeeIds));
  }
  const where = conds.length > 0 ? and(...conds) : undefined;
  const baseQuery = requireDb().select().from(calls);
  const q = where ? baseQuery.where(where) : baseQuery;
  const rows = await q.orderBy(desc(calls.startedAt)).limit(filter.limit ?? 1000);
  return rows.map(rowToCall);
}

export async function bulkInsertCalls(input: {
  employeeId: string;
  records: Array<{
    phoneNumber: string;
    contactName?: string | null;
    type: CallType;
    startedAt: string;
    durationSec: number;
  }>;
}): Promise<{ added: number; skipped: number }> {
  if (input.records.length === 0) return { added: 0, skipped: 0 };
  const rows = input.records.map((r, i) => ({
    id: `call-${Date.now().toString(36)}-${i}-${Math.random().toString(16).slice(2, 6)}`,
    employeeId: input.employeeId,
    contactName: r.contactName ?? null,
    phoneNumber: r.phoneNumber,
    type: r.type,
    startedAt: new Date(r.startedAt),
    durationSec: Math.max(0, Math.floor(r.durationSec || 0)),
  }));
  const result = await requireDb()
    .insert(calls)
    .values(rows)
    .onConflictDoNothing()
    .returning({ id: calls.id });
  const added = result.length;
  return { added, skipped: rows.length - added };
}

// ---------------- Sessions ----------------

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function createSessionRow(userId: string, token: string) {
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await requireDb().insert(sessions).values({ token, userId, expiresAt });
  return { token, expiresAt };
}

export async function getSessionRow(token: string) {
  const r = await requireDb()
    .select()
    .from(sessions)
    .where(eq(sessions.token, token))
    .limit(1);
  const row = r[0];
  if (!row) return null;
  if (row.expiresAt.getTime() < Date.now()) {
    await requireDb().delete(sessions).where(eq(sessions.token, token));
    return null;
  }
  return row;
}

export async function deleteSessionRow(token: string) {
  await requireDb().delete(sessions).where(eq(sessions.token, token));
}


// ---------------- Missed-call follow-ups ----------------

export const MISSED_SLA_HOURS = 24;

export interface MissedCallGroup {
  employeeId: string;
  employeeName: string;
  phoneNumber: string;
  contactName: string | null;
  latestMissedAt: string;
  missedCount: number;
  returnedAt: string | null;
  returnedVia: "auto" | "manual" | null;
  // Hours between the latest miss and either the return or now (clamped to 0).
  ageHours: number;
}

export async function listMissedCallGroups(args: {
  employeeIds: string[];
  windowDays?: number;
}): Promise<MissedCallGroup[]> {
  if (args.employeeIds.length === 0) return [];
  const since = new Date(Date.now() - (args.windowDays ?? 30) * 24 * 3600 * 1000);

  const allCalls = await requireDb()
    .select()
    .from(calls)
    .where(and(inArray(calls.employeeId, args.employeeIds), gte(calls.startedAt, since)));

  const overrides = await requireDb()
    .select()
    .from(callFollowups)
    .where(inArray(callFollowups.employeeId, args.employeeIds));
  const overrideMap = new Map<string, Date | null>();
  for (const o of overrides) {
    overrideMap.set(`${o.employeeId}|${o.phoneNumber}`, o.manuallyReturnedAt);
  }

  const employees = await listEmployees();
  const empName = new Map(employees.map((e) => [e.id, e.name]));

  // Group by (employeeId, phoneNumber); track misses + outgoing
  type Group = {
    employeeId: string;
    phoneNumber: string;
    contactName: string | null;
    misses: Date[];
    outgoing: Date[];
  };
  const groups = new Map<string, Group>();
  for (const c of allCalls) {
    if (c.type !== "missed" && c.type !== "rejected" && c.type !== "outgoing") continue;
    const key = `${c.employeeId}|${c.phoneNumber}`;
    let g = groups.get(key);
    if (!g) {
      g = {
        employeeId: c.employeeId,
        phoneNumber: c.phoneNumber,
        contactName: c.contactName,
        misses: [],
        outgoing: [],
      };
      groups.set(key, g);
    }
    if (c.type === "outgoing") g.outgoing.push(c.startedAt);
    else g.misses.push(c.startedAt);
    if (!g.contactName && c.contactName) g.contactName = c.contactName;
  }

  const now = Date.now();
  const out: MissedCallGroup[] = [];
  for (const g of groups.values()) {
    if (g.misses.length === 0) continue; // ignore groups with only outgoing
    const latestMiss = g.misses.reduce((a, b) => (a > b ? a : b));
    // Earliest outgoing strictly after the latest miss
    const auto = g.outgoing
      .filter((d) => d > latestMiss)
      .reduce<Date | null>((a, b) => (a === null || b < a ? b : a), null);
    const override = overrideMap.get(`${g.employeeId}|${g.phoneNumber}`) ?? null;
    let returnedAt: Date | null = null;
    let via: "auto" | "manual" | null = null;
    if (override && override > latestMiss) {
      returnedAt = override;
      via = "manual";
    } else if (auto) {
      returnedAt = auto;
      via = "auto";
    }
    const refTime = (returnedAt ?? new Date()).getTime();
    const ageHours = Math.max(0, (refTime - latestMiss.getTime()) / 3600_000);
    out.push({
      employeeId: g.employeeId,
      employeeName: empName.get(g.employeeId) ?? g.employeeId,
      phoneNumber: g.phoneNumber,
      contactName: g.contactName,
      latestMissedAt: latestMiss.toISOString(),
      missedCount: g.misses.length,
      returnedAt: returnedAt?.toISOString() ?? null,
      returnedVia: via,
      ageHours,
    });
  }

  // Sort: pending oldest first, then returned newest first
  out.sort((a, b) => {
    const aP = a.returnedAt === null ? 1 : 0;
    const bP = b.returnedAt === null ? 1 : 0;
    if (aP !== bP) return bP - aP; // pending(1) before returned(0)
    if (aP === 1) return a.latestMissedAt.localeCompare(b.latestMissedAt); // oldest first
    return b.latestMissedAt.localeCompare(a.latestMissedAt); // newest first
  });
  return out;
}

export async function setMissedReturned(
  employeeId: string,
  phoneNumber: string,
  returnedAt: Date | null,
) {
  await requireDb()
    .insert(callFollowups)
    .values({ employeeId, phoneNumber, manuallyReturnedAt: returnedAt, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: [callFollowups.employeeId, callFollowups.phoneNumber],
      set: { manuallyReturnedAt: returnedAt, updatedAt: new Date() },
    });
}
