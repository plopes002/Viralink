// src/lib/metricsPeriod.ts
type HistoryItem = {
  date?: string;
  createdAt?: string;
  followers?: number;
  engagementRate?: number;
  avgLikes?: number;
  avgComments?: number;
};

function getHistoryDate(item: HistoryItem) {
  return item.date || item.createdAt || "";
}

export function filterHistoryByPeriod<T extends HistoryItem>(
  history: T[],
  days: 7 | 30 | 90,
) {
  if (!Array.isArray(history) || history.length === 0) return [];

  const validHistory = history.filter((item) => !!getHistoryDate(item));

  if (validHistory.length === 0) return [];

  const sorted = [...validHistory].sort((a, b) =>
    getHistoryDate(a).localeCompare(getHistoryDate(b))
  );

  const lastDateRaw = getHistoryDate(sorted[sorted.length - 1]);

  if (!lastDateRaw) return sorted;

  const lastDate = new Date(lastDateRaw);
  const minDate = new Date(lastDate);
  minDate.setDate(minDate.getDate() - (days - 1));

  return sorted.filter((item) => {
    const itemDateRaw = getHistoryDate(item);
    if (!itemDateRaw) return false;

    const d = new Date(itemDateRaw);
    return d >= minDate && d <= lastDate;
  });
}

export function calculateVariationPercent<T extends HistoryItem>(
  history: T[],
  metric: keyof Pick<
    HistoryItem,
    "followers" | "engagementRate" | "avgLikes" | "avgComments"
  >,
) {
  if (!Array.isArray(history) || history.length < 2) return null;

  const validHistory = history.filter((item) => !!getHistoryDate(item));

  if (validHistory.length < 2) return null;

  const sorted = [...validHistory].sort((a, b) =>
    getHistoryDate(a).localeCompare(getHistoryDate(b))
  );

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