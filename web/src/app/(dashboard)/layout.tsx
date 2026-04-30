import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { readSessionFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");
  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      <Sidebar role={session.role} name={session.name} />
      <main className="flex-1 min-w-0 flex flex-col">{children}</main>
    </div>
  );
}
