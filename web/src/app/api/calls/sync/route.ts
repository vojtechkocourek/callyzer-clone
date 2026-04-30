import { NextRequest, NextResponse } from "next/server";
import { readSessionFromToken } from "@/lib/auth";
import { bulkInsertCalls } from "@/lib/store";
import type { CallType } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  const token = auth?.toLowerCase().startsWith("bearer ") ? auth.slice(7) : null;
  const session = await readSessionFromToken(token);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const incoming = Array.isArray(body.calls) ? body.calls : [];
  const validTypes: CallType[] = ["incoming", "outgoing", "missed", "rejected"];

  const cleaned: Array<{
    phoneNumber: string;
    contactName: string | null;
    type: CallType;
    startedAt: string;
    durationSec: number;
  }> = [];
  let invalid = 0;
  for (const raw of incoming) {
    if (
      !raw ||
      typeof raw.phoneNumber !== "string" ||
      typeof raw.startedAt !== "string" ||
      typeof raw.durationSec !== "number" ||
      !validTypes.includes(raw.type)
    ) {
      invalid++;
      continue;
    }
    cleaned.push({
      phoneNumber: raw.phoneNumber,
      contactName: typeof raw.contactName === "string" ? raw.contactName : null,
      type: raw.type,
      startedAt: raw.startedAt,
      durationSec: raw.durationSec,
    });
  }
  const { added, skipped } = await bulkInsertCalls({
    employeeId: session.userId,
    records: cleaned,
  });
  return NextResponse.json({ added, skipped: skipped + invalid });
}
