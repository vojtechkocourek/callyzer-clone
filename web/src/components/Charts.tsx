"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type DailyPoint = {
  date: string;
  incoming: number;
  outgoing: number;
  missed: number;
  rejected: number;
  talkMin: number;
};

const COLORS = {
  incoming: "#1f4fdb",
  outgoing: "#316bff",
  missed: "#f59e0b",
  rejected: "#ef4444",
  talk: "#10b981",
};

export function CallVolumeChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="font-medium text-slate-900">Call volume (last 14 days)</h3>
      </div>
      <div style={{ width: "100%", height: 260 }}>
        <ResponsiveContainer>
          <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
            <Bar dataKey="incoming" stackId="a" fill={COLORS.incoming} />
            <Bar dataKey="outgoing" stackId="a" fill={COLORS.outgoing} />
            <Bar dataKey="missed" stackId="a" fill={COLORS.missed} />
            <Bar dataKey="rejected" stackId="a" fill={COLORS.rejected} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TalkTimeChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="font-medium text-slate-900 mb-2">Talk time (minutes)</h3>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(d) => d.slice(5)} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line type="monotone" dataKey="talkMin" stroke={COLORS.talk} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function TypeBreakdown({
  incoming,
  outgoing,
  missed,
  rejected,
}: {
  incoming: number;
  outgoing: number;
  missed: number;
  rejected: number;
}) {
  const data = [
    { name: "Incoming", value: incoming, color: COLORS.incoming },
    { name: "Outgoing", value: outgoing, color: COLORS.outgoing },
    { name: "Missed", value: missed, color: COLORS.missed },
    { name: "Rejected", value: rejected, color: COLORS.rejected },
  ];
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4">
      <h3 className="font-medium text-slate-900 mb-2">Call type breakdown</h3>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" innerRadius={48} outerRadius={80}>
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
