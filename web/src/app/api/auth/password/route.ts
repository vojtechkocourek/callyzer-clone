import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { hashPassword, readSessionFromCookie } from "@/lib/auth";
import { getUserRowByEmail, updateEmployee } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const session = await readSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: "Both passwords required" }, { status: 400 });
  }
  if (String(newPassword).length < 8) {
    return NextResponse.json({ error: "New password must be at least 8 characters" }, { status: 400 });
  }

  // Verify current password against stored hash
  // (we re-fetch by email to avoid exposing the hash via session)
  const me = await getMe(session.userId);
  if (!me) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const ok = await bcrypt.compare(String(currentPassword), me.passwordHash);
  if (!ok) return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });

  await updateEmployee(session.userId, {
    passwordHash: await hashPassword(String(newPassword)),
  });
  return NextResponse.json({ ok: true });
}

async function getMe(userId: string) {
  // Use email-based lookup since it returns the password hash
  const { listEmployees } = await import("@/lib/store");
  const all = await listEmployees();
  const m = all.find((e) => e.id === userId);
  if (!m) return null;
  return getUserRowByEmail(m.email);
}
