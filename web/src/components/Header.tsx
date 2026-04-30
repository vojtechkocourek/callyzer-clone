import { Bell, Search } from "lucide-react";

export default function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
      <div className="flex-1">
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      <div className="hidden md:flex items-center gap-2 text-sm bg-slate-100 rounded-lg px-3 py-1.5 text-slate-500 w-72">
        <Search size={14} />
        <input
          placeholder="Search calls, employees…"
          className="bg-transparent flex-1 outline-none placeholder:text-slate-400"
        />
      </div>
      <button className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 relative" aria-label="Notifications">
        <Bell size={18} />
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full"></span>
      </button>
    </header>
  );
}
