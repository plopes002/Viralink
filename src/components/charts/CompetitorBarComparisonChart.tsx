// src/components/charts/CompetitorBarComparisonChart.tsx
"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HistoryPoint = {
  id?: string;
  date?: string;
  createdAt?: string;
  avgLikes?: number;
  avgComments?: number;
};

type Props = {
  title: string;
  metric: "avgLikes" | "avgComments";
  myLabel: string;
  competitorLabel: string;
  myHistory: HistoryPoint[];
  competitorHistory: HistoryPoint[];
};

function getHistoryDate(point: HistoryPoint) {
  return point.date || point.createdAt || "";
}

function getLatestValue(
  history: HistoryPoint[],
  metric: "avgLikes" | "avgComments",
) {
  if (!Array.isArray(history) || history.length === 0) return 0;

  const validHistory = history.filter((item) => !!getHistoryDate(item));
  if (validHistory.length === 0) return 0;

  const sorted = [...validHistory].sort((a, b) =>
    getHistoryDate(a).localeCompare(getHistoryDate(b))
  );

  return Number(sorted[sorted.length - 1]?.[metric] || 0);
}

export default function CompetitorBarComparisonChart({
  title,
  metric,
  myLabel,
  competitorLabel,
  myHistory,
  competitorHistory,
}: Props) {
  const myValue = getLatestValue(myHistory, metric);
  const competitorValue = getLatestValue(competitorHistory, metric);

  const data = [
    {
      name: metric === "avgLikes" ? "Likes médios" : "Comentários médios",
      myValue,
      competitorValue,
    },
  ];

  return (
    <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="#272046" strokeDasharray="3 3" />
            <XAxis
              dataKey="name"
              stroke="#9CA3AF"
              tick={{ fontSize: 11 }}
            />
            <YAxis
              stroke="#9CA3AF"
              tick={{ fontSize: 11 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#020012",
                border: "1px solid #272046",
                color: "#fff",
              }}
            />
            <Legend />
            <Bar
              dataKey="myValue"
              name={myLabel}
              fill="#8B5CF6"
              radius={[6, 6, 0, 0]}
            />
            <Bar
              dataKey="competitorValue"
              name={competitorLabel}
              fill="#06B6D4"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}