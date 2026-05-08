import { NextRequest, NextResponse } from "next/server";
import {
  setSessionCookie,
  startSession,
  verifyCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const { email, password, mode } = await req.json();
  if (!email || !password) {
    return NextResponse.json({ error: "Email and password required" }, { status: 400 });
  }
  const user = await verifyCredentials(String(email), String(password));
  if (!user) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }
  const isApi = mode === "api";
  const session = await startSession(user.id, isApi ? "api" : "web");
  if (!session) {
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
  if (!isApi) setSessionCookie(session.token);
  return NextResponse.json({
    token: session.token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      teamId: user.teamId,
    },
  });
}
