"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PhoneCall } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      setErr(j.error ?? "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      <div className="hidden lg:flex flex-col justify-between bg-brand-700 text-white p-12">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-white/15 rounded-lg grid place-items-center">
            <PhoneCall size={20} />
          </div>
          <div className="font-semibold">Callyzer Clone</div>
        </div>
        <div>
          <h2 className="text-3xl font-semibold leading-tight">
            Track every call.<br />
            Coach every rep.
          </h2>
          <p className="text-brand-100 mt-3 max-w-md">
            Real-time call analytics, employee leaderboards, and exportable reports for your sales
            and support teams.
          </p>
        </div>
        <div className="text-xs text-brand-200">© 2026 Callyzer Clone</div>
      </div>

      <div className="flex items-center justify-center p-8 bg-white">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Welcome back</h1>
            <p className="text-sm text-slate-500">Sign in to your dashboard</p>
          </div>

          <label className="block text-sm">
            <span className="text-slate-700">Email</span>
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" />
          </label>

          <label className="block text-sm">
            <span className="text-slate-700">Password</span>
            <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" required
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 outline-none focus:border-brand-500" />
          </label>

          {err && <div className="text-sm text-rose-600">{err}</div>}

          <button disabled={busy}
            className="w-full rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-medium py-2 disabled:opacity-60">
            {busy ? "Signing in…" : "Sign in"}
          </button>

          <div className="border-t border-slate-200 pt-3 text-xs text-slate-500">
            Use the admin email and password you set when running the seed
            script. New team members are created from the dashboard once
            you're signed in.
          </div>
        </form>
      </div>
    </div>
  );
}
