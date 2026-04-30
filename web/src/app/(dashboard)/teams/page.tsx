import Header from "@/components/Header";
import { readSessionFromCookie } from "@/lib/auth";
import { listCalls, listEmployees, listTeams } from "@/lib/store";
import { visibleEmployees } from "@/lib/scope";
import { fmtDuration, summarize } from "@/lib/analytics";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function TeamsPage() {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");

  const all = await listEmployees();
  const employees = visibleEmployees(all, session);
  const calls = await listCalls({ employeeIds: employees.map((e) => e.id), limit: 5000 });
  const allTeams = await listTeams();

  const visibleTeamIds = new Set(employees.map((e) => e.teamId).filter(Boolean) as string[]);
  const teams = allTeams.filter((t) => session.role === "admin" || visibleTeamIds.has(t.id));
  const empById = new Map(all.map((e) => [e.id, e]));

  return (
    <>
      <Header title="Teams" subtitle={`${teams.length} team${teams.length === 1 ? "" : "s"}`} />
      <div className="p-4 sm:p-6 grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {teams.map((t) => {
          const members = employees.filter((e) => e.teamId === t.id);
          const teamCalls = calls.filter((c) => members.some((m) => m.id === c.employeeId));
          const k = summarize(teamCalls);
          const manager = empById.get(t.managerId ?? "");
          return (
            <div key={t.id} className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div>
                <div className="text-xs text-slate-500">{t.branch}</div>
                <h3 className="font-semibold text-slate-900">{t.name}</h3>
              </div>
              <div className="text-sm text-slate-600">
                Manager: <span className="text-slate-900">{manager?.name ?? "—"}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">Members</div>
                  <div className="font-semibold">{members.length}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">Calls</div>
                  <div className="font-semibold">{k.totalCalls}</div>
                </div>
                <div className="bg-slate-50 rounded-lg p-2">
                  <div className="text-xs text-slate-500">Talk</div>
                  <div className="font-semibold">{fmtDuration(k.totalTalkSec)}</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-1">
                {members.slice(0, 8).map((m) => (
                  <span key={m.id} className="text-xs rounded-full bg-brand-50 text-brand-700 px-2 py-0.5">{m.name}</span>
                ))}
                {members.length > 8 && (
                  <span className="text-xs text-slate-500">+{members.length - 8} more</span>
                )}
              </div>
            </div>
          );
        })}
        {teams.length === 0 && (
          <div className="text-slate-500 text-sm">No teams available in your scope.</div>
        )}
      </div>
    </>
  );
}
