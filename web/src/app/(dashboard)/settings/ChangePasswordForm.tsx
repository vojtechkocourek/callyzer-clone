"use client";

import { useState } from "react";
import { KeyRound } from "lucide-react";

export default function ChangePasswordForm() {
  const [current, setCurrent] = useState("");
  const [next1, setNext1] = useState("");
  const [next2, setNext2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    if (next1 !== next2) {
      setMsg({ ok: false, text: "New passwords don't match." });
      return;
    }
    if (next1.length < 8) {
      setMsg({ ok: false, text: "New password must be at least 8 characters." });
      return;
    }
    setBusy(true);
    const res = await fetch("/api/auth/password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next1 }),
    });
    setBusy(false);
    const j = await res.json().catch(() => ({}));
    if (!res.ok) {
      setMsg({ ok: false, text: j.error ?? "Could not change password" });
      return;
    }
    setCurrent("");
    setNext1("");
    setNext2("");
    setMsg({ ok: true, text: "Password updated. Use the new one next time you log in." });
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="font-medium text-slate-900 flex items-center gap-2">
        <KeyRound size={16} /> Change my password
      </h3>
      <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)}
        placeholder="Current password" required
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      <input type="password" value={next1} onChange={(e) => setNext1(e.target.value)}
        placeholder="New password (min 8 characters)" required
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      <input type="password" value={next2} onChange={(e) => setNext2(e.target.value)}
        placeholder="Confirm new password" required
        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      {msg && (
        <div className={msg.ok ? "text-sm text-emerald-700" : "text-sm text-rose-600"}>
          {msg.text}
        </div>
      )}
      <button disabled={busy}
        className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-2 disabled:opacity-60">
        {busy ? "Saving…" : "Update password"}
      </button>
    </form>
  );
}
