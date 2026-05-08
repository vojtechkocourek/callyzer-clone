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

// kind distinguishes browser cookie sessions ("web") from long-lived device
// tokens issued to the Android app ("api"). Each kind has its own TTL — see
// SESSION_TTL_MS_BY_KIND in store.ts.
export const sessions = pgTable("sessions", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  kind: text("kind").notNull().default("web"),
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


// Microsoft Graph (Outlook) connection per user. One row per rep that has
// connected their mailbox. Tokens stored as plaintext for now; rotate the
// MICROSOFT_CLIENT_SECRET env var if any token leaks.
export const emailAccounts = pgTable("email_accounts", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  provider: text("provider").notNull().default("microsoft"),
  externalEmail: text("external_email").notNull(),
  accessToken: text("access_token").notNull(),
  refreshToken: text("refresh_token").notNull(),
  // When the access token expires; refresh before this.
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  scope: text("scope").notNull().default(""),
  connectedAt: timestamp("connected_at", { withTimezone: true }).notNull().defaultNow(),
  // Last time we polled this mailbox successfully.
  lastPolledAt: timestamp("last_polled_at", { withTimezone: true }),
});

// One row per outbound email we observed (and later, per inbound reply too).
// Only metadata is stored; never subject, body, or unhashed recipient.
export const emailEvents = pgTable(
  "email_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    externalId: text("external_id").notNull(), // Graph message id
    conversationId: text("conversation_id").notNull(),
    direction: text("direction").notNull(), // "sent" | "received_reply"
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull(),
    // SHA-256 of the recipient address, lowercased + trimmed
    recipientHash: text("recipient_hash"),
    // Domain only, e.g. "acme.com"
    recipientDomain: text("recipient_domain"),
  },
  (t) => ({
    extIdx: uniqueIndex("email_events_external_idx").on(t.userId, t.externalId),
  }),
);

export type EmailAccount = typeof emailAccounts.$inferSelect;
export type EmailEvent = typeof emailEvents.$inferSelect;
