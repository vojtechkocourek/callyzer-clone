"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function EmployeeCreateForm({
  teams,
}: {
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "employee",
    teamId: teams[0]?.id ?? "",
    password: randomPassword(),
  });

  function newPw() {
    setForm((f) => ({ ...f, password: randomPassword() }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/employees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Could not create");
      return;
    }
    setOpen(false);
    setForm({ ...form, name: "", email: "", phone: "", password: randomPassword() });
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-2"
      >
        <Plus size={14} /> Add employee
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
      <input required placeholder="Full name" value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      <input required type="email" placeholder="Email" value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      <input placeholder="Phone" value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm" />
      <select value={form.role}
        onChange={(e) => setForm({ ...form, role: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
        <option value="employee">Employee</option>
        <option value="manager">Manager</option>
        <option value="admin">Admin</option>
      </select>
      <select value={form.teamId}
        onChange={(e) => setForm({ ...form, teamId: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white">
        <option value="">No team</option>
        {teams.map((t) => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>
      <div className="flex gap-2">
        <input placeholder="Initial password (min 8)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono" />
        <button type="button" onClick={newPw}
          className="rounded-lg border border-slate-200 px-2 text-xs hover:bg-slate-50"
          title="Generate a random password">↻</button>
      </div>
      <div className="md:col-span-3 text-xs text-slate-500">
        Save this password somewhere safe before clicking Create — share it with the rep so they can sign in on the Android app.
      </div>
      {err && <div className="md:col-span-3 text-sm text-rose-600">{err}</div>}
      <div className="md:col-span-3 flex gap-2 justify-end">
        <button type="button" onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50">Cancel</button>
        <button disabled={busy}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 text-sm disabled:opacity-60">
          {busy ? "Saving…" : "Create"}
        </button>
      </div>
    </form>
  );
}

function randomPassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  let out = "";
  const a = new Uint8Array(12);
  crypto.getRandomValues(a);
  for (let i = 0; i < 12; i++) out += alphabet[a[i] % alphabet.length];
  return out;
}
