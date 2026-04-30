import { NextRequest, NextResponse } from "next/server";
import { clearSessionCookie, destroySession, readSessionFromCookie } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const s = await readSessionFromCookie();
  if (s) await destroySession(s.token);
  clearSessionCookie();
  if ((req.headers.get("accept") ?? "").includes("text/html")) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  return NextResponse.json({ ok: true });
}
