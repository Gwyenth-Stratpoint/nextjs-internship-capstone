"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type AnalyticsStatusChartProps = {
  data: Array<{
    name: string;
    value: number;
  }>;
};

const barColors = ["#5B6BFF", "#2F80ED", "#F59E0B", "#10B981"];

export function AnalyticsStatusChart({ data }: AnalyticsStatusChartProps) {
  return (
    <div className="h-72 rounded-[22px] border border-slate-200 bg-white/70 p-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} barCategoryGap={20}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="name"
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            tick={{ fill: "#64748B", fontSize: 12 }}
          />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            contentStyle={{
              borderRadius: "14px",
              border: "1px solid #E2E8F0",
              background: "rgba(255,255,255,0.96)",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
            }}
          />
          <Bar dataKey="value" radius={[10, 10, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`${entry.name}-${index}`} fill={barColors[index % barColors.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
