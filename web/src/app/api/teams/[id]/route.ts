import { NextRequest, NextResponse } from "next/server";
import { readSessionFromCookie } from "@/lib/auth";
import { deleteTeam, updateTeam } from "@/lib/store";

export const runtime = "nodejs";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSessionFromCookie();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, branch, managerId } = await req.json();
  const patch: Parameters<typeof updateTeam>[1] = {};
  if (typeof name === "string") patch.name = name;
  if (typeof branch === "string") patch.branch = branch;
  if (managerId === null || typeof managerId === "string") patch.managerId = managerId || null;
  const updated = await updateTeam(params.id, patch);
  if (!updated) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ team: updated });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await readSessionFromCookie();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const result = await deleteTeam(params.id);
  if (!result.ok) {
    return NextResponse.json({ error: result.reason ?? "Could not delete" }, { status: 409 });
  }
  return NextResponse.json({ ok: true });
}
