import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import {
  createSessionRow,
  deleteSessionRow,
  getSessionRow,
  getUserRowByEmail,
  getEmployeeById,
} from "./store";
import type { Session } from "./types";

const COOKIE = "callyzer_session";

export const COOKIE_NAME = COOKIE;

export async function verifyCredentials(email: string, password: string) {
  const row = await getUserRowByEmail(email);
  if (!row || !row.active) return null;
  const ok = await bcrypt.compare(password, row.passwordHash);
  if (!ok) return null;
  return row;
}

export async function startSession(userId: string): Promise<Session | null> {
  const u = await getEmployeeById(userId);
  if (!u) return null;
  const token = randomToken();
  await createSessionRow(userId, token);
  return {
    token,
    userId: u.id,
    role: u.role,
    name: u.name,
    teamId: u.teamId,
  };
}

export async function readSessionFromCookie(): Promise<Session | null> {
  const c = cookies().get(COOKIE);
  if (!c) return null;
  return readSessionFromToken(c.value);
}

export async function readSessionFromToken(
  token: string | undefined | null,
): Promise<Session | null> {
  if (!token) return null;
  const row = await getSessionRow(token);
  if (!row) return null;
  const u = await getEmployeeById(row.userId);
  if (!u || !u.active) return null;
  return { token, userId: u.id, role: u.role, name: u.name, teamId: u.teamId };
}

export async function destroySession(token: string) {
  await deleteSessionRow(token);
}

export function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

function randomToken() {
  const a = new Uint8Array(24);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}
