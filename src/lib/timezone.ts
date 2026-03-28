// src/lib/timezone.ts


export function toUtcDateFromLocalInput(
  dateStr: string,
  timeStr: string,
  timeZone: string,
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  if (
    !year || !month || !day ||
    Number.isNaN(hour) || Number.isNaN(minute)
  ) {
    throw new Error("Data ou hora inválida.");
  }

  const pad = (value: number) => String(value).padStart(2, "0");

  // Momento UTC inicial aproximado
  const utcGuess = new Date(Date.UTC(year, month - 1, day, hour, minute, 0, 0));

  // Descobre como esse momento aparece no timezone desejado
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const parts = formatter.formatToParts(utcGuess);
  const map: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      map[part.type] = part.value;
    }
  }

  const tzAsUtc = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour),
    Number(map.minute),
    Number(map.second || "0"),
    0,
  );

  const intendedUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);
  const diff = intendedUtc - tzAsUtc;

  return new Date(utcGuess.getTime() + diff);
} 