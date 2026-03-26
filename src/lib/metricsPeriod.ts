// src/lib/metricsPeriod.ts
type HistoryItem = {
  date: string;
  followers?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
};

export function filterHistoryByPeriod<T extends HistoryItem>(
  history: T[],
  days: 7 | 30 | 90,
) {
  if (!history.length) return [];

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const lastDate = new Date(sorted[sorted.length - 1].date);
  const minDate = new Date(lastDate);
  minDate.setDate(minDate.getDate() - (days - 1));

  return sorted.filter((item) => {
    const d = new Date(item.date);
    return d >= minDate && d <= lastDate;
  });
}

export function calculateVariationPercent<T extends HistoryItem>(
  history: T[],
  metric: keyof Pick<HistoryItem, "followers" | "engagementRate" | "avgLikes" | "avgComments">,
) {
  if (history.length < 2) return null;

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const first = Number(sorted[0][metric] || 0);
  const last = Number(sorted[sorted.length - 1][metric] || 0);

  if (first === 0) {
    if (last === 0) return 0;
    return null;
  }

  return ((last - first) / first) * 100;
}

export function formatVariation(value: number | null) {
  if (value === null || Number.isNaN(value)) return "-";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
}
