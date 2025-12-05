// src/lib/scheduleFormatting.ts

export function formatRunAtWithTimezone(
  runAt: Date,
  timeZone: string,
): { label: string; timeOnly: string; full: string } {
  const now = new Date();
  const todayStr = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  const runAtStr = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(runAt);

  const timeStr = new Intl.DateTimeFormat("pt-BR", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(runAt);

  let label = runAtStr;

  if (runAtStr === todayStr) {
    label = "Hoje";
  } else {
    // checar se é amanhã
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = new Intl.DateTimeFormat("pt-BR", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(tomorrow);

    if (runAtStr === tomorrowStr) label = "Amanhã";
  }

  return {
    label,
    timeOnly: timeStr,
    full: `${label} • ${timeStr}`,
  };
}

export function getTimeZoneLabel(tz: string) {
  // Pode sofisticar depois; por enquanto algo simples:
  if (tz === "America/Sao_Paulo") return "horário de Brasília";
  if (tz === "America/Manaus") return "horário de Manaus";
  if (tz === "America/Boa_Vista") return "horário de Roraima";
  if (tz === "America/Porto_Velho") return "horário de Rondônia";
  return `fuso ${tz}`;
}
