"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

export default function TeamCreateForm({
  managers,
}: {
  managers: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    branch: "",
    managerId: "",
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/teams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Could not create team");
      return;
    }
    setOpen(false);
    setForm({ name: "", branch: "", managerId: "" });
    router.refresh();
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-2"
      >
        <Plus size={14} /> Add team
      </button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="bg-white border border-slate-200 rounded-xl p-4 grid grid-cols-1 md:grid-cols-3 gap-3"
    >
      <input
        required
        placeholder="Team name (e.g. Sales — Europe)"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <input
        placeholder="Branch / location (optional)"
        value={form.branch}
        onChange={(e) => setForm({ ...form, branch: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
      />
      <select
        value={form.managerId}
        onChange={(e) => setForm({ ...form, managerId: e.target.value })}
        className="rounded-lg border border-slate-200 px-3 py-2 text-sm bg-white"
      >
        <option value="">No manager (assign later)</option>
        {managers.map((m) => (
          <option key={m.id} value={m.id}>{m.name}</option>
        ))}
      </select>
      <div className="md:col-span-3 text-xs text-slate-500">
        Tip: also assign the manager (and reps) to this team via the Employees page so role-based scoping kicks in — managers will then only see their team's calls and stats.
      </div>
      {err && <div className="md:col-span-3 text-sm text-rose-600">{err}</div>}
      <div className="md:col-span-3 flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm hover:bg-slate-50"
        >
          Cancel
        </button>
        <button
          disabled={busy}
          className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white px-3 py-2 text-sm disabled:opacity-60"
        >
          {busy ? "Saving…" : "Create team"}
        </button>
      </div>
    </form>
  );
}
