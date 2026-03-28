// src/lib/scheduleFormatting.ts

type FirestoreLikeTimestamp = {
  toDate?: () => Date;
  seconds?: number;
  nanoseconds?: number;
};

function normalizeToDate(value: unknown): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "toDate" in value &&
    typeof (value as FirestoreLikeTimestamp).toDate === "function"
  ) {
    const parsed = (value as FirestoreLikeTimestamp).toDate!();
    return parsed instanceof Date && !isNaN(parsed.getTime()) ? parsed : null;
  }

  if (
    typeof value === "object" &&
    value !== null &&
    "seconds" in value &&
    typeof (value as FirestoreLikeTimestamp).seconds === "number"
  ) {
    const seconds = (value as FirestoreLikeTimestamp).seconds ?? 0;
    const nanoseconds = (value as FirestoreLikeTimestamp).nanoseconds ?? 0;
    const parsed = new Date(seconds * 1000 + Math.floor(nanoseconds / 1_000_000));
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

export function getTimeZoneLabel(timeZone?: string | null) {
  if (!timeZone) return "horário local";

  const map: Record<string, string> = {
    "America/Sao_Paulo": "horário de Brasília",
    "America/New_York": "horário de Nova York",
    "Europe/London": "horário de Londres",
  };

  return map[timeZone] ?? timeZone;
}

export function formatRunAtWithTimezone(
  value: unknown,
  timeZone?: string | null
) {
  const date = normalizeToDate(value);

  if (!date) {
    return {
      full: "Sem data agendada",
      date: "—",
      time: "—",
      iso: null,
    };
  }

  const locale = "pt-BR";
  const zone = timeZone || "America/Sao_Paulo";

  const datePart = new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

  const timePart = new Intl.DateTimeFormat(locale, {
    timeZone: zone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);

  return {
    full: `${datePart} • ${timePart}`,
    date: datePart,
    time: timePart,
    iso: date.toISOString(),
  };
}