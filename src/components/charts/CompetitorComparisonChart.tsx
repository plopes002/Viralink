// src/components/charts/CompetitorComparisonChart.tsx
"use client";

import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type HistoryPoint = {
  id?: string;
  date?: string;
  createdAt?: string;
  followers?: number;
  engagementRate?: number;
};

type Props = {
  title: string;
  metric: "followers" | "engagementRate";
  myLabel: string;
  competitorLabel: string;
  myHistory: HistoryPoint[];
  competitorHistory: HistoryPoint[];
};

function getHistoryDate(item: HistoryPoint) {
  return item.date || item.createdAt || "";
}

function mergeHistory(
  myHistory: HistoryPoint[],
  competitorHistory: HistoryPoint[],
  metric: "followers" | "engagementRate",
) {
  const map = new Map<
    string,
    {
      date: string;
      myValue?: number;
      competitorValue?: number;
    }
  >();

  for (const item of myHistory) {
    const itemDate = getHistoryDate(item);
    if (!itemDate) continue;

    if (!map.has(itemDate)) {
      map.set(itemDate, { date: itemDate });
    }

    const row = map.get(itemDate)!;
    row.myValue = Number(item[metric] || 0);
  }

  for (const item of competitorHistory) {
    const itemDate = getHistoryDate(item);
    if (!itemDate) continue;

    if (!map.has(itemDate)) {
      map.set(itemDate, { date: itemDate });
    }

    const row = map.get(itemDate)!;
    row.competitorValue = Number(item[metric] || 0);
  }

  return Array.from(map.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );
}

export default function CompetitorComparisonChart({
  title,
  metric,
  myLabel,
  competitorLabel,
  myHistory,
  competitorHistory,
}: Props) {
  const data = mergeHistory(myHistory, competitorHistory, metric);

  return (
    <div className="rounded-2xl border border-[#272046] bg-[#050016] p-4">
      <h3 className="text-sm font-semibold text-white mb-4">{title}</h3>

      <div className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid stroke="#272046" strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
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
            <Line
              type="monotone"
              dataKey="myValue"
              name={myLabel}
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="competitorValue"
              name={competitorLabel}
              stroke="#06B6D4"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}