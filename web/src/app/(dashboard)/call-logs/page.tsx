import Header from "@/components/Header";
import { readSessionFromCookie } from "@/lib/auth";
import { listCalls, listEmployees } from "@/lib/store";
import { visibleEmployees } from "@/lib/scope";
import { fmtDuration } from "@/lib/analytics";
import { redirect } from "next/navigation";
import clsx from "clsx";
import type { CallType } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = { employeeId?: string; type?: string; from?: string; to?: string; q?: string };

export default async function CallLogsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");

  const all = await listEmployees();
  const employees = visibleEmployees(all, session);
  let rows = await listCalls({
    employeeIds: employees.map((e) => e.id),
    employeeId: searchParams.employeeId,
    type: (searchParams.type as CallType | undefined) || undefined,
    from: searchParams.from,
    to: searchParams.to,
    limit: 1000,
  });
  if (searchParams.q) {
    const q = searchParams.q.toLowerCase();
    rows = rows.filter(
      (c) =>
        c.phoneNumber.toLowerCase().includes(q) ||
        (c.contactName ?? "").toLowerCase().includes(q),
    );
  }

  const empName = new Map(all.map((e) => [e.id, e.name]));
  const sliced = rows.slice(0, 200);

  const typePill = (t: string) => {
    const map: Record<string, string> = {
      incoming: "bg-brand-50 text-brand-700",
      outgoing: "bg-emerald-50 text-emerald-700",
      missed: "bg-amber-50 text-amber-700",
      rejected: "bg-rose-50 text-rose-700",
    };
    return clsx("rounded-full px-2 py-0.5 text-xs capitalize", map[t] ?? "bg-slate-100");
  };

  return (
    <>
      <Header title="Call Logs" subtitle={`${rows.length.toLocaleString()} matching records`} />
      <div className="p-4 sm:p-6 space-y-4">
        <form className="flex flex-wrap gap-2 items-end bg-white p-3 border border-slate-200 rounded-xl">
          <label className="text-xs text-slate-500">
            Employee
            <select name="employeeId" defaultValue={searchParams.employeeId ?? ""}
              className="block mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white">
              <option value="">All</option>
              {employees.filter((e) => e.role !== "admin").map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Type
            <select name="type" defaultValue={searchParams.type ?? ""}
              className="block mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white">
              <option value="">All</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
              <option value="missed">Missed</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <label className="text-xs text-slate-500">
            From
            <input type="date" name="from" defaultValue={searchParams.from?.slice(0, 10) ?? ""}
              className="block mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs text-slate-500">
            To
            <input type="date" name="to" defaultValue={searchParams.to?.slice(0, 10) ?? ""}
              className="block mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          </label>
          <label className="text-xs text-slate-500 flex-1 min-w-[180px]">
            Search
            <input type="text" name="q" defaultValue={searchParams.q ?? ""} placeholder="number or contact"
              className="block mt-1 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm" />
          </label>
          <button className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-2">Apply</button>
          <a href="/call-logs" className="rounded-lg border border-slate-200 text-sm px-3 py-2 hover:bg-slate-50">Reset</a>
        </form>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left font-medium px-4 py-2">When</th>
                <th className="text-left font-medium px-4 py-2">Employee</th>
                <th className="text-left font-medium px-4 py-2">Type</th>
                <th className="text-left font-medium px-4 py-2">Number</th>
                <th className="text-left font-medium px-4 py-2">Contact</th>
                <th className="text-right font-medium px-4 py-2">Duration</th>
              </tr>
            </thead>
            <tbody>
              {sliced.length === 0 && (
                <tr><td colSpan={6} className="text-center text-slate-400 py-12">No calls match these filters.</td></tr>
              )}
              {sliced.map((c) => (
                <tr key={c.id} className="border-t border-slate-100 hover:bg-slate-50/60">
                  <td className="px-4 py-2 text-slate-600 whitespace-nowrap">{new Date(c.startedAt).toLocaleString()}</td>
                  <td className="px-4 py-2">{empName.get(c.employeeId) ?? c.employeeId}</td>
                  <td className="px-4 py-2"><span className={typePill(c.type)}>{c.type}</span></td>
                  <td className="px-4 py-2 font-mono text-xs text-slate-700">{c.phoneNumber}</td>
                  <td className="px-4 py-2 text-slate-600">{c.contactName ?? "—"}</td>
                  <td className="px-4 py-2 text-right whitespace-nowrap">{fmtDuration(c.durationSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
          {rows.length > sliced.length && (
            <div className="text-xs text-slate-400 px-4 py-2 border-t border-slate-100">
              Showing first {sliced.length} of {rows.length.toLocaleString()} — refine filters to narrow.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
