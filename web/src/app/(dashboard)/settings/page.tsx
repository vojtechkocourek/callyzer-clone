import Header from "@/components/Header";
import { readSessionFromCookie } from "@/lib/auth";
import { getEmployeeById } from "@/lib/store";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await readSessionFromCookie();
  if (!session) redirect("/login");
  const me = await getEmployeeById(session.userId);
  if (!me) redirect("/login");

  return (
    <>
      <Header title="Settings" subtitle="Profile and Android companion setup" />
      <div className="p-4 sm:p-6 grid md:grid-cols-2 gap-4">
        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="font-medium text-slate-900">My profile</h3>
          <Field label="Name" value={me.name} />
          <Field label="Email" value={me.email} />
          <Field label="Phone" value={me.phone || "—"} />
          <Field label="Role" value={me.role} />
          <Field label="Joined" value={new Date(me.joinedAt).toLocaleDateString()} />
        </section>

        <section className="bg-white border border-slate-200 rounded-xl p-5 space-y-3">
          <h3 className="font-medium text-slate-900">Android companion</h3>
          <p className="text-sm text-slate-600">
            Install the Callyzer Clone Android app on each rep's phone. The app will request{" "}
            <code className="px-1 bg-slate-100 rounded">READ_CALL_LOG</code> permission and
            then upload new call records to this dashboard from anywhere.
          </p>
          <ol className="text-sm text-slate-600 list-decimal pl-5 space-y-1">
            <li>Install the Callyzer Clone Android app on each rep's phone.</li>
            <li>Set the API URL to your deployed dashboard URL (e.g. <code>https://callyzer-yourname.vercel.app</code>).</li>
            <li>Sign in with the email and password you created for that rep.</li>
            <li>Grant <code>READ_CALL_LOG</code> permission and tap <strong>Sync now</strong>.</li>
          </ol>
          <div className="text-xs text-slate-500">
            Background sync runs every 30 minutes once permissions are granted.
            Reps don't need to share Wi-Fi with you — sync goes to your public dashboard.
          </div>
        </section>
      </div>
    </>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 gap-3 text-sm">
      <div className="text-slate-500 capitalize">{label}</div>
      <div className="col-span-2 text-slate-900">{value}</div>
    </div>
  );
}
