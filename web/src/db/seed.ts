/**
 * Seed the database with an initial admin user.
 * Required env vars:  DATABASE_URL  ADMIN_EMAIL  ADMIN_PASSWORD
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
      "Set ADMIN_EMAIL and ADMIN_PASSWORD before running seed (creates the first admin login).",
    );
  }
  if (adminPassword.length < 8) {
    throw new Error("ADMIN_PASSWORD must be at least 8 characters.");
  }

  // Default team (idempotent)
  await db
    .insert(teams)
    .values({ id: "team-default", name: "Sales Team", branch: "Main" })
    .onConflictDoNothing();

  // Admin user (idempotent on email)
  const existing = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
  if (existing.length === 0) {
    const hash = await bcrypt.hash(adminPassword, 10);
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
    console.log(`Admin user already exists: ${adminEmail}`);
  }

  console.log("Seed complete.");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
