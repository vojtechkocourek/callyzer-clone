"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Phone,
  Users,
  Building2,
  FileBarChart2,
  Settings,
  LogOut,
  PhoneCall,
} from "lucide-react";
import clsx from "clsx";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/call-logs", label: "Call Logs", icon: Phone },
  { href: "/employees", label: "Employees", icon: Users, adminOnly: false },
  { href: "/teams", label: "Teams", icon: Building2, adminOnly: false },
  { href: "/reports", label: "Reports", icon: FileBarChart2 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({ role, name }: { role: string; name: string }) {
  const path = usePathname();
  return (
    <aside className="w-60 shrink-0 border-r border-slate-200 bg-white flex flex-col">
      <div className="px-5 py-5 flex items-center gap-2 border-b border-slate-200">
        <div className="w-9 h-9 rounded-lg bg-brand-600 text-white grid place-items-center">
          <PhoneCall size={18} />
        </div>
        <div>
          <div className="text-sm font-semibold leading-tight">Callyzer Clone</div>
          <div className="text-[11px] text-slate-500">Call Analytics</div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {items.map((it) => {
          const Icon = it.icon;
          const active = path?.startsWith(it.href);
          return (
            <Link
              key={it.href}
              href={it.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                active
                  ? "bg-brand-50 text-brand-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50",
              )}
            >
              <Icon size={16} />
              {it.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-slate-200">
        <div className="px-2 py-2 text-xs text-slate-500">
          Signed in as
          <div className="text-slate-900 font-medium text-sm capitalize">
            {name} <span className="text-slate-400 font-normal">({role})</span>
          </div>
        </div>
        <form action="/api/auth/logout" method="post">
          <button
            type="submit"
            formAction="/api/auth/logout"
            className="w-full mt-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            <LogOut size={16} /> Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
