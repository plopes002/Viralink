// src/lib/timezone.ts

/**
 * Recebe:
 *  - dateStr: "2025-12-10"
 *  - timeStr: "14:30"
 *  - timeZone: "America/Manaus"
 * Retorna: Date em UTC representando aquele horário no fuso informado.
 */
export function toUtcDateFromLocalInput(
  dateStr: string,
  timeStr: string,
  timeZone: string,
): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  const [hour, minute] = timeStr.split(":").map(Number);

  // Cria uma data "local" no fuso informado
  const local = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));

  // Descobre o offset daquele fuso na data dada
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  const parts = formatter.formatToParts(local);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";

  const tzYear = Number(get("year"));
  const tzMonth = Number(get("month"));
  const tzDay = Number(get("day"));
  const tzHour = Number(get("hour"));
  const tzMinute = Number(get("minute"));

  // Data correta no fuso → converte para UTC
  // Como Date guarda sempre UTC internamente, basta usar Date.UTC
  const utc = new Date(Date.UTC(tzYear, tzMonth - 1, tzDay, tzHour, tzMinute, 0));

  return utc;
}
