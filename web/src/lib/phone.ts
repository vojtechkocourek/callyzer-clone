/**
 * Normalize a phone number to E.164 format (e.g. +420605123456).
 *
 * Simple rules:
 *  - Strip everything except digits and a leading "+".
 *  - If number starts with "+", trust it (already E.164-ish).
 *  - If number starts with "00" (international prefix), replace with "+".
 *  - If number starts with "0" (national trunk prefix), drop the 0 and prepend
 *    the configured default country code.
 *  - Otherwise prepend the default country code as-is.
 *
 * Default country comes from the DEFAULT_COUNTRY_CODE env var (e.g. "+420").
 * Falls back to "+420" (Czech Republic) if unset.
 */
const DEFAULT_CC = process.env.DEFAULT_COUNTRY_CODE?.replace(/[^+0-9]/g, "") || "+420";

export function normalizePhone(raw: string): string {
  if (!raw) return raw;
  // Keep + only if it's the very first character.
  let s = raw.trim();
  const hadPlus = s.startsWith("+");
  s = s.replace(/[^0-9]/g, "");
  if (!s) return raw;

  if (hadPlus) return "+" + s;
  if (s.startsWith("00")) return "+" + s.slice(2);
  if (s.startsWith("0")) return DEFAULT_CC + s.slice(1);
  // If it looks like it already has a country code (10+ digits, doesn't start with 0)
  // we still default-prefix to keep behavior predictable. Tweak per deployment.
  return DEFAULT_CC + s;
}
