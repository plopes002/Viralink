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

  // Cria uma string no formato ISO 8601, mas sem o 'Z' para que seja interpretada
  // como "local" no fuso horário do sistema que está executando (ex: o browser do usuário).
  // Isso não é o ideal, o ideal é construir o objeto Date a partir dos componentes
  // já no fuso correto, mas a API do Date() no JS é um pouco traiçoeira.
  // Uma abordagem mais robusta usaria uma lib como `date-fns-tz`.
  // Por ora, vamos compor a string e depois ajustar.
  
  // Passo 1: Criar uma data "ingênua"
  const naiveDateStr = `${year}-${String(month).padStart(2, "0")}-${String(
    day,
  ).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(
    minute,
  ).padStart(2, "0")}:00`;
  
  // Passo 2: Usar Intl.DateTimeFormat para saber qual o offset do fuso na data específica.
  // Isso é importante por causa do horário de verão.
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timeZone,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit'
  });
  
  const parts = formatter.formatToParts(new Date(naiveDateStr));
  const partValue = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find(p => p.type === type)?.value ?? '0';

  const tzYear = parseInt(partValue('year'));
  const tzMonth = parseInt(partValue('month')) - 1; // Mês é 0-indexado no Date
  const tzDay = parseInt(partValue('day'));
  const tzHour = parseInt(partValue('hour'));
  const tzMinute = parseInt(partValue('minute'));

  // Reconstruir a data com os componentes no fuso horário correto,
  // mas o JS vai interpretar isso no fuso LOCAL da máquina executando.
  const localDateForTz = new Date(tzYear, tzMonth, tzDay, tzHour, tzMinute);
  
  // Agora, calculamos a diferença de offset entre o fuso desejado e o fuso local.
  const localOffset = localDateForTz.getTimezoneOffset() * 60 * 1000;
  
  // Para obter o offset do fuso desejado, criamos uma data no fuso e uma em UTC e comparamos.
  const dateInTz = new Date(new Date(naiveDateStr).toLocaleString('en-US', { timeZone }));
  const utcDate = new Date(naiveDateStr);
  const tzOffset = utcDate.getTime() - dateInTz.getTime();
  
  // Finalmente, ajustamos a data inicial pela diferença dos offsets.
  const finalUtcTimestamp = localDateForTz.getTime() + localOffset + tzOffset;
  
  return new Date(finalUtcTimestamp);
}
