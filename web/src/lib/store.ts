/**
 * Data access layer. All functions are async and hit Postgres via Drizzle.
 */
import { and, desc, eq, gte, lte, inArray } from "drizzle-orm";
import { requireDb } from "@/db";
import { calls, sessions, teams, users } from "@/db/schema";
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

export async function listCalls(filter: CallFilter = {}): Promise<CallRecord[]> {
  const conds = [];
  if (filter.employeeId) conds.push(eq(calls.employeeId, filter.employeeId));
  if (filter.type) conds.push(eq(calls.type, filter.type));
  if (filter.from) conds.push(gte(calls.startedAt, new Date(filter.from)));
  if (filter.to) conds.push(lte(calls.startedAt, new Date(filter.to)));
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
