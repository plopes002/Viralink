// src/lib/deliveryGuards.ts
export function isQuietHours(
  date: Date,
  start = 22,
  end = 8,
) {
  const hour = date.getHours();
  if (start > end) {
    return hour >= start || hour < end;
  }
  return hour >= start && hour < end;
}
