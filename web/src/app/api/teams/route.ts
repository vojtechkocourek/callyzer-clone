import { NextRequest, NextResponse } from "next/server";
import { readSessionFromCookie } from "@/lib/auth";
import { createTeam, listTeams } from "@/lib/store";

export const runtime = "nodejs";

export async function GET() {
  const session = await readSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return NextResponse.json({ teams: await listTeams() });
}

export async function POST(req: NextRequest) {
  const session = await readSessionFromCookie();
  if (!session || session.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { name, branch, managerId } = await req.json();
  if (!name) return NextResponse.json({ error: "Missing name" }, { status: 400 });
  const t = await createTeam({
    id: `team-${Date.now().toString(36)}`,
    name,
    branch: branch ?? "",
    managerId: managerId || null,
  });
  return NextResponse.json({ team: t });
}
