import Header from "@/components/Header";
import { readSessionFromCookie } from "@/lib/auth";
import { listCalls, listEmployees, listTeams } from "@/lib/store";
import { visibleEmployees } from "@/lib/scope";
import { fmtDuration, leaderboard } from "@/lib/analytics";
import { redirect } from "next/navigation";
import EmployeeCreateForm from "./EmployeeCreateForm";
import clsx from "clsx";

export const dynamic = "force-dynamic";

export default async function EmployeesPage() {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");

  const all = await listEmployees();
  const employees = visibleEmployees(all, session);
  const teams = await listTeams();
  const calls = await listCalls({ employeeIds: employees.map((e) => e.id), limit: 5000 });
  const stats = new Map(leaderboard(calls, employees).map((r) => [r.employeeId, r]));
  const teamName = new Map(teams.map((t) => [t.id, t.name]));

  return (
    <>
      <Header title="Employees" subtitle={`${employees.length} people in scope`} />
      <div className="p-4 sm:p-6 space-y-4">
        {session.role === "admin" && (
          <EmployeeCreateForm teams={teams.map((t) => ({ id: t.id, name: t.name }))} />
        )}

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
              <tr>
                <th className="text-left font-medium px-4 py-2">Name</th>
                <th className="text-left font-medium px-4 py-2">Role</th>
                <th className="text-left font-medium px-4 py-2">Team</th>
                <th className="text-left font-medium px-4 py-2">Email</th>
                <th className="text-left font-medium px-4 py-2">Phone</th>
                <th className="text-right font-medium px-4 py-2">Calls</th>
                <th className="text-right font-medium px-4 py-2">Talk</th>
                <th className="text-left font-medium px-4 py-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e) => {
                const s = stats.get(e.id);
                return (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="px-4 py-2 font-medium">{e.name}</td>
                    <td className="px-4 py-2 capitalize text-slate-600">{e.role}</td>
                    <td className="px-4 py-2 text-slate-600">{e.teamId ? teamName.get(e.teamId) ?? "—" : "—"}</td>
                    <td className="px-4 py-2 text-slate-600">{e.email}</td>
                    <td className="px-4 py-2 font-mono text-xs text-slate-600">{e.phone}</td>
                    <td className="px-4 py-2 text-right">{s?.totalCalls ?? 0}</td>
                    <td className="px-4 py-2 text-right">{fmtDuration(s?.talkSec ?? 0)}</td>
                    <td className="px-4 py-2">
                      <span className={clsx(
                        "rounded-full px-2 py-0.5 text-xs",
                        e.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500",
                      )}>
                        {e.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        </div>
      </div>
    </>
  );
}
