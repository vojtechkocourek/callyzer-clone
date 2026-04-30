import { NextRequest, NextResponse } from "next/server";
import { hashPassword, readSessionFromCookie } from "@/lib/auth";
import { createEmployee, getUserRowByEmail, listEmployees } from "@/lib/store";
import { visibleEmployees } from "@/lib/scope";

export const runtime = "nodejs";

export async function GET() {
  const session = await readSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const all = await listEmployees();
  return NextResponse.json({ employees: visibleEmployees(all, session) });
}

export async function POST(req: NextRequest) {
  const session = await readSessionFromCookie();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { name, email, phone, role, teamId, password } = body ?? {};
  if (!name || !email || !role || !password) {
    return NextResponse.json({ error: "Missing fields (name, email, role, password)" }, { status: 400 });
  }
  if (!["admin", "manager", "employee"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  if (String(password).length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }
  const existing = await getUserRowByEmail(String(email));
  if (existing) {
    return NextResponse.json({ error: "Email already in use" }, { status: 409 });
  }
  const emp = await createEmployee({
    id: `emp-${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 6)}`,
    name,
    email,
    phone: phone ?? "",
    role,
    teamId: teamId || null,
    passwordHash: await hashPassword(String(password)),
  });
  return NextResponse.json({ employee: emp });
}
