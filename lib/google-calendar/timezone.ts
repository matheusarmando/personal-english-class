/**
 * Converte data+hora "de parede" (o que o professor digitou, sem
 * fuso) num instante UTC preciso, usando o timezone salvo em
 * `profiles.timezone`. Necessário porque o Google trabalha em
 * RFC3339 com offset explícito — sem isso a comparação de
 * conflito compara instantes errados.
 */
export function converterParaInstanteUTC(dataISO: string, horaISO: string, timeZone: string): Date {
  const [ano, mes, dia] = dataISO.split("-").map(Number);
  const [hora, minuto] = horaISO.split(":").map(Number);

  // Chute inicial: trata os componentes digitados como se já fossem UTC.
  const chuteUTC = Date.UTC(ano, mes - 1, dia, hora, minuto, 0);

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const valores: Record<string, number> = {};
  for (const parte of formatter.formatToParts(new Date(chuteUTC))) {
    if (parte.type !== "literal") valores[parte.type] = Number(parte.value);
  }

  // O que o chute representa quando lido nesse timezone.
  const comoTimeZone = Date.UTC(
    valores.year,
    valores.month - 1,
    valores.day,
    valores.hour === 24 ? 0 : valores.hour,
    valores.minute,
    valores.second
  );

  const offsetMs = comoTimeZone - chuteUTC;
  return new Date(chuteUTC - offsetMs);
}
