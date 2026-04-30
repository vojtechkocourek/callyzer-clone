import Header from "@/components/Header";
import { readSessionFromCookie } from "@/lib/auth";
import { listEmployees, listMissedCallGroups, MISSED_SLA_HOURS } from "@/lib/store";
import { visibleEmployees } from "@/lib/scope";
import { redirect } from "next/navigation";
import clsx from "clsx";
import { Phone } from "lucide-react";
import MissedReturnButton from "./MissedReturnButton";

export const dynamic = "force-dynamic";

type SearchParams = { tab?: "pending" | "returned" };

export default async function MissedCallsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");

  const tab = searchParams.tab === "returned" ? "returned" : "pending";

  const all = await listEmployees();
  const employees = visibleEmployees(all, session);
  const groups = await listMissedCallGroups({
    employeeIds: employees.map((e) => e.id),
    windowDays: 30,
  });

  const pending = groups.filter((g) => g.returnedAt === null);
  const returned = groups.filter((g) => g.returnedAt !== null);

  const overdue = pending.filter((g) => g.ageHours >= MISSED_SLA_HOURS);
  // Average return time across the returned set, in hours
  const avgReturnHours =
    returned.length === 0
      ? null
      : returned.reduce((s, g) => s + g.ageHours, 0) / returned.length;

  const rows = tab === "pending" ? pending : returned;

  return (
    <>
      <Header
        title="Missed Calls"
        subtitle={`${pending.length} pending · ${overdue.length} over ${MISSED_SLA_HOURS}h${avgReturnHours !== null ? " · avg return " + fmtHours(avgReturnHours) : ""}`}
      />
      <div className="p-4 sm:p-6 space-y-4">
        <div className="flex gap-1 bg-white border border-slate-200 rounded-xl p-1 w-fit">
          <TabLink active={tab === "pending"} href="/missed-calls?tab=pending">
            Pending <span className="ml-1 text-xs text-slate-500">{pending.length}</span>
          </TabLink>
          <TabLink active={tab === "returned"} href="/missed-calls?tab=returned">
            Returned <span className="ml-1 text-xs text-slate-500">{returned.length}</span>
          </TabLink>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full text-sm min-w-[600px]">
              <thead className="bg-slate-50 text-xs text-slate-500 uppercase">
                <tr>
                  <th className="text-left font-medium px-4 py-2">Contact</th>
                  <th className="text-left font-medium px-4 py-2">Number</th>
                  <th className="text-left font-medium px-4 py-2">Employee</th>
                  <th className="text-left font-medium px-4 py-2">Last missed</th>
                  <th className="text-left font-medium px-4 py-2">
                    {tab === "pending" ? "Age" : "Returned"}
                  </th>
                  <th className="text-right font-medium px-4 py-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-slate-400 py-12">
                      {tab === "pending"
                        ? "No pending missed calls. 🎉"
                        : "No missed calls have been returned yet."}
                    </td>
                  </tr>
                )}
                {rows.map((g) => (
                  <tr key={g.employeeId + "|" + g.phoneNumber} className="border-t border-slate-100">
                    <td className="px-4 py-2">
                      <div className="font-medium">{g.contactName ?? "Unknown"}</div>
                      {g.missedCount > 1 && (
                        <div className="text-xs text-rose-600">{g.missedCount} missed calls</div>
                      )}
                    </td>
                    <td className="px-4 py-2 font-mono text-xs">
                      <a href={`tel:${g.phoneNumber}`} className="text-brand-700 hover:underline">
                        {g.phoneNumber}
                      </a>
                    </td>
                    <td className="px-4 py-2 text-slate-700">{g.employeeName}</td>
                    <td className="px-4 py-2 text-slate-600 whitespace-nowrap">
                      {new Date(g.latestMissedAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {tab === "pending" ? (
                        <AgeBadge hours={g.ageHours} />
                      ) : (
                        <ReturnedBadge hours={g.ageHours} via={g.returnedVia!} />
                      )}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <MissedReturnButton
                        employeeId={g.employeeId}
                        phoneNumber={g.phoneNumber}
                        returned={g.returnedAt !== null}
                      />
                    </td>
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

function TabLink({
  active,
  href,
  children,
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={clsx(
        "px-3 py-1.5 rounded-lg text-sm",
        active ? "bg-brand-50 text-brand-700 font-medium" : "text-slate-600 hover:bg-slate-50",
      )}
    >
      {children}
    </a>
  );
}

function AgeBadge({ hours }: { hours: number }) {
  const overdue = hours >= MISSED_SLA_HOURS;
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs",
        overdue ? "bg-rose-50 text-rose-700" : "bg-amber-50 text-amber-700",
      )}
    >
      <Phone size={11} /> {fmtHours(hours)}
    </span>
  );
}

function ReturnedBadge({ hours, via }: { hours: number; via: "auto" | "manual" }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs bg-emerald-50 text-emerald-700">
      ✓ {fmtHours(hours)} {via === "manual" ? "(manual)" : ""}
    </span>
  );
}

function fmtHours(h: number): string {
  if (h < 1) return `${Math.max(1, Math.round(h * 60))}m`;
  if (h < 48) return `${Math.round(h)}h`;
  return `${Math.round(h / 24)}d`;
}
