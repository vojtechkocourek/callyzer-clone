import Header from "@/components/Header";
import KpiCard from "@/components/KpiCard";
import { CallVolumeChart, TalkTimeChart, TypeBreakdown } from "@/components/Charts";
import { readSessionFromCookie } from "@/lib/auth";
import { listCalls, listEmployees, listTeams } from "@/lib/store";
import { visibleEmployees } from "@/lib/scope";
import { dailySeries, fmtDuration, leaderboard, summarize } from "@/lib/analytics";
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, Timer, Users } from "lucide-react";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

type SearchParams = {
  from?: string;
  to?: string;
  teamId?: string;
  employeeId?: string;
};

export default async function DashboardPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");

  const all = await listEmployees();
  const teams = await listTeams();
  let employees = visibleEmployees(all, session);

  // Apply team / employee filters from URL
  if (searchParams.teamId) {
    employees = employees.filter((e) => e.teamId === searchParams.teamId);
  }
  if (searchParams.employeeId) {
    employees = employees.filter((e) => e.id === searchParams.employeeId);
  }

  const calls = await listCalls({
    employeeIds: employees.map((e) => e.id),
    from: searchParams.from,
    to: searchParams.to,
    limit: 5000,
  });

  const kpi = summarize(calls);
  const series = dailySeries(calls, 14);
  const leaders = leaderboard(calls, employees).slice(0, 5);

  // Visible team list (admins see all, managers/employees see what's in their scope)
  const scopedTeamIds = new Set(employees.map((e) => e.teamId).filter(Boolean) as string[]);
  const teamOptions =
    session.role === "admin" ? teams : teams.filter((t) => scopedTeamIds.has(t.id));
  const employeeOptions = visibleEmployees(all, session).filter(
    (e) => e.role !== "admin" && (!searchParams.teamId || e.teamId === searchParams.teamId),
  );

  const subtitle =
    session.role === "admin"
      ? "Company-wide call activity"
      : session.role === "manager"
        ? "Your team's activity"
        : "Your call activity";

  return (
    <>
      <Header title="Dashboard" subtitle={subtitle} />
      <div className="p-4 sm:p-6 space-y-6">
        {/* Filter bar */}
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
            Team
            <select name="teamId" defaultValue={searchParams.teamId ?? ""}
              className="block mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white">
              <option value="">All teams</option>
              {teamOptions.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-500">
            Employee
            <select name="employeeId" defaultValue={searchParams.employeeId ?? ""}
              className="block mt-1 rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white">
              <option value="">All employees</option>
              {employeeOptions.map((e) => (
                <option key={e.id} value={e.id}>{e.name}</option>
              ))}
            </select>
          </label>
          <button className="rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-sm px-3 py-2">Apply</button>
          <a href="/dashboard" className="rounded-lg border border-slate-200 text-sm px-3 py-2 hover:bg-slate-50">Reset</a>
        </form>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total calls" value={kpi.totalCalls.toLocaleString()} icon={Phone} tone="brand" />
          <KpiCard label="Talk time" value={fmtDuration(kpi.totalTalkSec)} icon={Timer} tone="emerald" />
          <KpiCard label="Avg duration" value={fmtDuration(kpi.avgDurationSec)} icon={PhoneOutgoing} tone="slate" />
          <KpiCard label="Active reps" value={employees.filter((e) => e.role !== "admin" && e.active).length} icon={Users} tone="brand" />
          <KpiCard label="Incoming" value={kpi.incoming.toLocaleString()} icon={PhoneIncoming} tone="brand" />
          <KpiCard label="Outgoing" value={kpi.outgoing.toLocaleString()} icon={PhoneOutgoing} tone="emerald" />
          <KpiCard label="Missed" value={kpi.missed.toLocaleString()} icon={PhoneMissed} tone="amber" />
          <KpiCard label="Rejected" value={kpi.rejected.toLocaleString()} icon={PhoneMissed} tone="rose" />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><CallVolumeChart data={series} /></div>
          <TypeBreakdown
            incoming={kpi.incoming}
            outgoing={kpi.outgoing}
            missed={kpi.missed}
            rejected={kpi.rejected}
          />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2"><TalkTimeChart data={series} /></div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h3 className="font-medium text-slate-900 mb-2">Top performers</h3>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-sm min-w-[400px]">
                <thead className="text-xs text-slate-500 text-left">
                  <tr>
                    <th className="py-1.5 font-medium">Employee</th>
                    <th className="py-1.5 font-medium text-right">Calls</th>
                    <th className="py-1.5 font-medium text-right">Talk</th>
                  </tr>
                </thead>
                <tbody>
                  {leaders.length === 0 && (
                    <tr><td colSpan={3} className="py-6 text-center text-slate-400">No data yet</td></tr>
                  )}
                  {leaders.map((r) => (
                    <tr key={r.employeeId} className="border-t border-slate-100">
                      <td className="py-2">{r.name}</td>
                      <td className="py-2 text-right">{r.totalCalls}</td>
                      <td className="py-2 text-right">{fmtDuration(r.talkSec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
