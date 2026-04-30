"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";

type Team = {
  id: string;
  name: string;
  branch: string;
  managerId: string | null;
};

export default function TeamCardActions({
  team,
  managers,
}: {
  team: Team;
  managers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: team.name,
    branch: team.branch,
    managerId: team.managerId ?? "",
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch(`/api/teams/${team.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        branch: form.branch,
        managerId: form.managerId || null,
      }),
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
    if (!confirm(`Delete team "${team.name}"?`)) return;
    setBusy(true);
    const res = await fetch(`/api/teams/${team.id}`, { method: "DELETE" });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      alert(j.error ?? "Delete failed");
      return;
    }
    router.refresh();
  }

  if (!editing) {
    return (
      <div className="flex gap-1">
        <button
          onClick={() => setEditing(true)}
          className="p-1.5 rounded hover:bg-slate-100 text-slate-500"
          title="Edit team"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="p-1.5 rounded hover:bg-rose-50 text-rose-500 disabled:opacity-50"
          title="Delete team"
        >
          <Trash2 size={14} />
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={save} className="space-y-2 mt-2">
      <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="Team name" required
        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
      <input value={form.branch} onChange={(e) => setForm({ ...form, branch: e.target.value })}
        placeholder="Branch / location"
        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm" />
      <select value={form.managerId} onChange={(e) => setForm({ ...form, managerId: e.target.value })}
        className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm bg-white">
        <option value="">No manager</option>
        {managers.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      {err && <div className="text-sm text-rose-600">{err}</div>}
      <div className="flex gap-2 justify-end">
        <button type="button" onClick={() => setEditing(false)}
          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50">Cancel</button>
        <button disabled={busy}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-1.5 text-xs disabled:opacity-60">
          {busy ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  );
}
