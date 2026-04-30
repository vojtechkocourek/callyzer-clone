import { NextRequest, NextResponse } from "next/server";
import { hashPassword, readSessionFromCookie } from "@/lib/auth";
import { deleteEmployee, updateEmployee } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSessionFromCookie();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json();
  const { password, ...rest } = body ?? {};
  const patch: Parameters<typeof updateEmployee>[1] = { ...rest };
  if (typeof password === "string" && password.length > 0) {
    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }
    patch.passwordHash = await hashPassword(password);
  }
  const updated = await updateEmployee(params.id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ employee: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSessionFromCookie();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  await deleteEmployee(params.id);
  return NextResponse.json({ ok: true });
}
