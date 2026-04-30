/**
 * Seed / reset the initial admin user.
 *
 * Required env vars: DATABASE_URL  ADMIN_EMAIL  ADMIN_PASSWORD
 *
 * - First run: creates the admin row.
 * - Subsequent runs: re-hashes ADMIN_PASSWORD and updates the row.
 *   Use this to recover when you've forgotten the admin password.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { requireDb } from "./index";
import { teams, users } from "./schema";

async function main() {
  const db = requireDb();

  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Set ADMIN_EMAIL and ADMIN_PASSWORD before running seed.",
    );
  }
  if (adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  await db
    .insert(teams)
    .values({ id: "team-default", name: "Sales Team", branch: "Main" })
    .onConflictDoNothing();

  const hash = await bcrypt.hash(adminPassword, 10);
  const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);

  if (existing.length === 0) {
    await db.insert(users).values({
      id: "admin-" + Date.now().toString(36),
      name: "Admin",
      email: adminEmail,
      phone: "",
      role: "admin",
      teamId: null,
      passwordHash: hash,
      active: true,
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else {
    await db
      .update(users)
      .set({ passwordHash: hash, active: true, role: "admin" })
      .where(eq(users.email, adminEmail));
    console.log(`Reset password for existing admin: ${adminEmail}`);
  }

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
