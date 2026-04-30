import { redirect } from "next/navigation";
import AppShell from "@/components/AppShell";
import { readSessionFromCookie } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");
  return (
    <AppShell role={session.role} name={session.name}>
      {children}
    </AppShell>
  );
}
