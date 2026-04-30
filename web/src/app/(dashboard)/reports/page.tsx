import Header from "@/components/Header";
import { readSessionFromCookie } from "@/lib/auth";
import { listCalls, listEmployees } from "@/lib/store";
import { visibleEmployees } from "@/lib/scope";
import { fmtDuration, leaderboard, summarize } from "@/lib/analytics";
import { redirect } from "next/navigation";
import { Download } from "lucide-react";
import type { CallType } from "@/lib/types";

export const dynamic = "force-dynamic";

type SearchParams = { from?: string; to?: string; employeeId?: string; type?: string };

export default async function ReportsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");

  const all = await listEmployees();
  const employees = visibleEmployees(all, session);
  const calls = await listCalls({
    employeeIds: employees.map((e) => e.id),
    employeeId: searchParams.employeeId,
    type: (searchParams.type as CallType | undefined) || undefined,
    from: searchParams.from,
    to: searchParams.to,
    limit: 100000,
  });

  const totals = summarize(calls);
  const board = leaderboard(calls, employees);
  const csvHref =
    "/api/reports/csv?" +
    new URLSearchParams(
      Object.fromEntries(Object.entries(searchParams).filter(([, v]) => Boolean(v))) as Record<string, string>,
    ).toString();

  return (
    <>
      <Header title="Reports" subtitle="Slice the data, then export to CSV" />
      <div className="p-4 sm:p-6 space-y-4">
        <form className="bg-white p-3 border border-slate-200 rounded-xl flex flex-wrap gap-2 items-end">
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
          <button className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-2">Apply</button>
          <a href={csvHref} className="rounded-lg border border-slate-200 text-sm px-3 py-2 hover:bg-slate-50 inline-flex items-center gap-1">
            <Download size={14} /> Download CSV
          </a>
        </form>

        <div className="grid md:grid-cols-4 gap-3">
          <Stat label="Total calls" value={totals.totalCalls.toLocaleString()} />
          <Stat label="Talk time" value={fmtDuration(totals.totalTalkSec)} />
          <Stat label="Avg duration" value={fmtDuration(totals.avgDurationSec)} />
          <Stat label="Unique contacts" value={totals.uniqueContacts.toLocaleString()} />
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-200 font-medium">Per-employee summary</div>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left font-medium px-4 py-2">Employee</th>
                <th className="text-right font-medium px-4 py-2">Calls</th>
                <th className="text-right font-medium px-4 py-2">Outgoing</th>
                <th className="text-right font-medium px-4 py-2">Missed</th>
                <th className="text-right font-medium px-4 py-2">Talk</th>
              </tr>
            </thead>
            <tbody>
              {board.length === 0 && (
                <tr><td colSpan={5} className="text-center text-slate-400 py-12">No data for this slice.</td></tr>
              )}
              {board.map((r) => (
                <tr key={r.employeeId} className="border-t border-slate-100">
                  <td className="px-4 py-2">{r.name}</td>
                  <td className="px-4 py-2 text-right">{r.totalCalls}</td>
                  <td className="px-4 py-2 text-right">{r.outgoing}</td>
                  <td className="px-4 py-2 text-right">{r.missed}</td>
                  <td className="px-4 py-2 text-right">{fmtDuration(r.talkSec)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4">
      <div className="text-xs text-slate-500 uppercase tracking-wide">{label}</div>
      <div className="text-xl font-semibold mt-1">{value}</div>
    </div>
  );
}
