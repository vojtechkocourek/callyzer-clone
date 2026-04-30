import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["admin", "manager", "employee"]);
export const callTypeEnum = pgEnum("call_type", [
  "incoming",
  "outgoing",
  "missed",
  "rejected",
]);

export const teams = pgTable("teams", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  branch: text("branch").notNull().default(""),
  managerId: text("manager_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull().default(""),
    role: roleEnum("role").notNull(),
    teamId: text("team_id"),
    passwordHash: text("password_hash").notNull(),
    active: boolean("active").notNull().default(true),
    joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
  },
  (t) => ({
    emailIdx: uniqueIndex("users_email_idx").on(t.email),
  }),
);

export const calls = pgTable(
  "calls",
  {
    id: text("id").primaryKey(),
    employeeId: text("employee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    contactName: text("contact_name"),
    phoneNumber: text("phone_number").notNull(),
    type: callTypeEnum("type").notNull(),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    durationSec: integer("duration_sec").notNull().default(0),
  },
  (t) => ({
    dedupeIdx: uniqueIndex("calls_dedupe_idx").on(t.employeeId, t.phoneNumber, t.startedAt),
  }),
);

export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

// Tracks manual "this missed call group has been returned" overrides.
// One row per (employee, phoneNumber). Auto-detection from outgoing calls
// runs separately; this table only matters when a rep returned a call from
// somewhere the call log doesn't see (different phone, WhatsApp, etc.).
export const callFollowups = pgTable(
  "call_followups",
  {
    employeeId: text("employee_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    phoneNumber: text("phone_number").notNull(),
    manuallyReturnedAt: timestamp("manually_returned_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.employeeId, t.phoneNumber] }),
  }),
);

export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type CallRecord = typeof calls.$inferSelect;
export type NewCallRecord = typeof calls.$inferInsert;
export type SessionRow = typeof sessions.$inferSelect;
export type CallFollowup = typeof callFollowups.$inferSelect;
