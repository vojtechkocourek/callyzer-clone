"use client";

import { useState } from "react";
import { Menu, PhoneCall } from "lucide-react";
import Sidebar from "./Sidebar";

export default function AppShell({
  children,
  role,
  name,
}: {
  children: React.ReactNode;
  role: string;
  name: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Mobile backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar role={role} name={name} mobileOpen={open} onClose={() => setOpen(false)} />

      <main className="flex-1 min-w-0 flex flex-col">
        {/* Mobile top bar (hamburger + branding). Hidden on md+. */}
        <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex items-center gap-3">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="p-1.5 -ml-1 rounded-lg hover:bg-slate-100 text-slate-700"
          >
            <Menu size={20} />
          </button>
          <div className="w-7 h-7 rounded-lg bg-brand-600 text-white grid place-items-center">
            <PhoneCall size={14} />
          </div>
          <span className="font-semibold text-sm">Callyzer Clone</span>
        </div>
        {children}
      </main>
    </div>
  );
}
