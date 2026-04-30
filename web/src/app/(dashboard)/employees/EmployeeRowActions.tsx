"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";

type Employee = {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: "admin" | "manager" | "employee";
  teamId: string | null;
  active: boolean;
};

export default function EmployeeRowActions({
  employee,
  teams,
}: {
  employee: Employee;
  teams: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: employee.name,
    email: employee.email,
    phone: employee.phone,
    role: employee.role,
    teamId: employee.teamId ?? "",
    active: employee.active,
    password: "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const body: Record<string, unknown> = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      role: form.role,
      teamId: form.teamId || null,
      active: form.active,
    };
    if (form.password) body.password = form.password;
    const res = await fetch(`/api/employees/${employee.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Save failed");
      return;
    }
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    if (!confirm(`Delete ${employee.name}? This will also delete all their call records.`)) return;
    setBusy(true);
    const res = await fetch(`/api/employees/${employee.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      alert("Delete failed");
      return;
    }
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex gap-1 justify-end">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="p-1.5 rounded hover:bg-rose-50 text-rose-500 disabled:opacity-50"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <td colSpan={9} className="bg-slate-50 px-4 py-3">
      <form onSubmit={save} className="grid grid-cols-1 md:grid-cols-3 gap-2 items-end">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Name"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" required />
        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" required />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
        <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as Employee["role"] })}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white">
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="admin">Admin</option>
        </select>
        <select value={form.teamId} onChange={(e) => setForm({ ...form, teamId: e.target.value })}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white">
          <option value="">No team</option>
          {teams.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} />
          Active (can log in)
        </label>
        <input type="text" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
          placeholder="New password (leave blank to keep)"
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm font-mono md:col-span-2" />
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={() => setEditing(false)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm hover:bg-white">Cancel</button>
          <button disabled={busy}
            className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 text-sm disabled:opacity-60">
            {busy ? "Saving…" : "Save"}
          </button>
        </div>
        {err && <div className="md:col-span-3 text-sm text-rose-600">{err}</div>}
      </form>
    </td>
  );
}
