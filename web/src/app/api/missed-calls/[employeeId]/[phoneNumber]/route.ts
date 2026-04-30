import { NextRequest, NextResponse } from "next/server";
import { readSessionFromCookie } from "@/lib/auth";
import { listEmployees, setMissedReturned } from "@/lib/store";
import { visibleEmployees } from "@/lib/scope";

export const runtime = "nodejs";

async function authorize(employeeId: string) {
  const session = await readSessionFromCookie();
  if (!session) return { error: "Unauthorized", status: 401 } as const;
  const all = await listEmployees();
  const allowed = visibleEmployees(all, session).map((e) => e.id);
  if (!allowed.includes(employeeId)) {
    return { error: "Forbidden", status: 403 } as const;
  }
  return { ok: true } as const;
}

export async function POST(
  _req: NextRequest,
  { params }: { params: { employeeId: string; phoneNumber: string } },
) {
  const employeeId = decodeURIComponent(params.employeeId);
  const phoneNumber = decodeURIComponent(params.phoneNumber);
  const auth = await authorize(employeeId);
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });
  await setMissedReturned(employeeId, phoneNumber, new Date());
  return NextResponse.json({ ok: true });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { employeeId: string; phoneNumber: string } },
) {
  const employeeId = decodeURIComponent(params.employeeId);
  const phoneNumber = decodeURIComponent(params.phoneNumber);
  const auth = await authorize(employeeId);
  if (!("ok" in auth)) return NextResponse.json({ error: auth.error }, { status: auth.status });
  await setMissedReturned(employeeId, phoneNumber, null);
  return NextResponse.json({ ok: true });
}
