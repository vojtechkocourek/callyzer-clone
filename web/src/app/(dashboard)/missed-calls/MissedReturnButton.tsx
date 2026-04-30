"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export default function MissedReturnButton({
  employeeId,
  phoneNumber,
  returned,
}: {
  employeeId: string;
  phoneNumber: string;
  returned: boolean;
}) {
  const router = useRouter();
  const [isPending, start] = useTransition();
  const [busy, setBusy] = useState(false);

  async function call(method: "POST" | "DELETE") {
    setBusy(true);
    try {
      const path = `/api/missed-calls/${encodeURIComponent(employeeId)}/${encodeURIComponent(phoneNumber)}`;
      const res = await fetch(path, { method });
      if (!res.ok) throw new Error("Request failed");
      start(() => router.refresh());
    } finally {
      setBusy(false);
    }
  }

  if (returned) {
    return (
      <button
        type="button"
        disabled={busy || isPending}
        onClick={() => call("DELETE")}
        className="text-xs text-slate-500 hover:text-slate-900 disabled:opacity-50"
      >
        Undo
      </button>
    );
  }
  return (
    <button
      type="button"
      disabled={busy || isPending}
      onClick={() => call("POST")}
      className="text-xs rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1.5 disabled:opacity-50"
    >
      Mark returned
    </button>
  );
}
