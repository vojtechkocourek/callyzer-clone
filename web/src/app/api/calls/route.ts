import { NextRequest, NextResponse } from "next/server";
import { readSessionFromCookie } from "@/lib/auth";
import { listCalls, listEmployees } from "@/lib/store";
import { visibleEmployees } from "@/lib/scope";
import type { CallType } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const session = await readSessionFromCookie();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const url = new URL(req.url);
  const employeeId = url.searchParams.get("employeeId") ?? undefined;
  const type = (url.searchParams.get("type") as CallType | null) ?? undefined;
  const from = url.searchParams.get("from") ?? undefined;
  const to = url.searchParams.get("to") ?? undefined;

  const all = await listEmployees();
  const allowed = visibleEmployees(all, session).map((e) => e.id);
  const rows = await listCalls({
    employeeIds: allowed,
    employeeId,
    type,
    from,
    to,
    limit: 1000,
  });
  return NextResponse.json({ calls: rows });
}
