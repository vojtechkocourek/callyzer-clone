// Public domain types used across pages and API routes. The DB rows in
// `src/db/schema.ts` are the source of truth; these are normalized shapes
// (e.g. ISO date strings instead of Date objects, no password hash).

export type Role = "admin" | "manager" | "employee";
export type CallType = "incoming" | "outgoing" | "missed" | "rejected";

export interface Team {
  id: string;
  name: string;
  branch: string;
  managerId: string | null;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  teamId: string | null;
  active: boolean;
  joinedAt: string; // ISO datetime
  lastSyncedAt: string | null; // ISO datetime, null = never synced
}

export interface CallRecord {
  id: string;
  employeeId: string;
  contactName: string | null;
  phoneNumber: string;
  type: CallType;
  startedAt: string; // ISO datetime
  durationSec: number;
}

export interface Session {
  userId: string;
  role: Role;
  name: string;
  teamId: string | null;
  token: string;
}
