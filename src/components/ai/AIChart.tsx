import React from "react";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart,
} from "recharts";
import type { ChartConfig } from "./chartUtils";

const COLORS = ["#6366f1", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#06b6d4"];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg shadow-lg px-3 py-2 text-xs">
      <p className="font-semibold text-slate-700 dark:text-slate-200 mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color }} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: entry.color }} />
          {entry.name}: <span className="font-semibold">{typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}</span>
        </p>
      ))}
    </div>
  );
};

const AIChart: React.FC<{ config: ChartConfig }> = ({ config }) => {
  const { type, title, xKey, yKeys } = config;

  // Coerce all y-values to numbers
  const data = config.data.map((item) => {
    const row: Record<string, any> = { ...item };
    yKeys.forEach((yk) => {
      if (row[yk.key] !== undefined) row[yk.key] = Number(row[yk.key]) || 0;
    });
    return row;
  });

  if (!data.length) return null;

  return (
    <div className="my-4 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl p-4 shadow-sm">
      {title && <h4 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">{title}</h4>}
      <ResponsiveContainer width="100%" height={260}>
        {type === "bar" ? (
          <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} domain={[0, "auto"]} />
            <Tooltip content={<CustomTooltip />} />
            {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {yKeys.map((yk, i) => (
              <Bar key={yk.key} dataKey={yk.key} name={yk.label || yk.key} fill={yk.color || COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
            ))}
          </BarChart>
        ) : type === "area" ? (
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} domain={[0, "auto"]} />
            <Tooltip content={<CustomTooltip />} />
            {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {yKeys.map((yk, i) => (
              <Area key={yk.key} type="monotone" dataKey={yk.key} name={yk.label || yk.key}
                stroke={yk.color || COLORS[i % COLORS.length]} fill={yk.color || COLORS[i % COLORS.length]}
                fillOpacity={0.3} strokeWidth={2.5} dot={{ r: 3, fill: yk.color || COLORS[i % COLORS.length] }} />
            ))}
          </AreaChart>
        ) : type === "pie" ? (
          <PieChart>
            <Pie data={data} dataKey={yKeys[0]?.key || "value"} nameKey={xKey} cx="50%" cy="50%" outerRadius={90} innerRadius={45}
              paddingAngle={2} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              labelLine={{ stroke: "#94a3b8" }}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        ) : (
          <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey={xKey} tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={{ stroke: "#e2e8f0" }} domain={[0, "auto"]} />
            <Tooltip content={<CustomTooltip />} />
            {yKeys.length > 1 && <Legend wrapperStyle={{ fontSize: 11 }} />}
            {yKeys.map((yk, i) => (
              <Line key={yk.key} type="monotone" dataKey={yk.key} name={yk.label || yk.key}
                stroke={yk.color || COLORS[i % COLORS.length]} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            ))}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
};

export default AIChart;
