import type { CallRecord, Employee, Session } from "./types";

/**
 * Filter records based on the viewer's role.
 * - admin: sees everything
 * - manager: sees only their team's employees / their team's calls
 * - employee: sees only themselves
 */
export function visibleEmployees(all: Employee[], session: Session): Employee[] {
  if (session.role === "admin") return all;
  if (session.role === "manager") {
    return all.filter((e) => e.teamId === session.teamId || e.id === session.userId);
  }
  return all.filter((e) => e.id === session.userId);
}

export function visibleCalls(
  allCalls: CallRecord[],
  allEmployees: Employee[],
  session: Session,
): CallRecord[] {
  const allowedIds = new Set(visibleEmployees(allEmployees, session).map((e) => e.id));
  return allCalls.filter((c) => allowedIds.has(c.employeeId));
}
