import type { SupabaseClient } from "@supabase/supabase-js";
import { calcularIntervalosOcupados, type EventoParaOcupacao } from "./ocupacao";
import { consultarFreeBusy } from "./client";
import { obterAccessTokenValido } from "./tokens";
import { CHAVE_MARCADOR_AULA } from "./constantes";
import type { IntervaloOcupado } from "./tipos";

/**
 * Encontra o primeiro intervalo que sobrepõe [inicio, fim). Usa
 * comparação estrita — um evento que termina exatamente quando o
 * outro começa (fim === início) não é conflito.
 */
export function encontrarConflito(
  intervalos: IntervaloOcupado[],
  inicio: Date,
  fim: Date
): IntervaloOcupado | null {
  for (const intervalo of intervalos) {
    if (inicio < intervalo.fim && fim > intervalo.inicio) {
      return intervalo;
    }
  }
  return null;
}

export type ResultadoVerificacaoConflito = {
  contaConectada: boolean;
  conflito: IntervaloOcupado | null;
};

/**
 * Checa conflito pro agendamento de uma aula: primeiro contra o
 * espelho local (rápido), depois — se a conta tiver um access token
 * válido — revalida ao vivo via freeBusy.query (requisito 1.5), pra
 * não perder uma mudança recente na agenda que o sync local ainda
 * não capturou. Sem conta conectada, não bloqueia nada (a
 * sincronia é um enriquecimento, nunca uma dependência crítica).
 */
export async function verificarConflito(
  supabase: SupabaseClient,
  professorId: string,
  inicio: Date,
  fim: Date
): Promise<ResultadoVerificacaoConflito> {
  const { data: conta } = await supabase
    .from("google_calendar_accounts")
    .select("id, calendarios_selecionados, primary_calendar_id, ignorar_dia_inteiro")
    .eq("professor_id", professorId)
    .eq("status", "conectado")
    .maybeSingle();

  if (!conta) {
    return { contaConectada: false, conflito: null };
  }

  const { data: eventosLocais } = await supabase
    .from("google_calendar_events")
    .select("title, starts_at, ends_at, is_all_day, transparency, status, attendee_response, raw")
    .eq("account_id", conta.id)
    .lt("starts_at", fim.toISOString())
    .gt("ends_at", inicio.toISOString());

  const eventos: EventoParaOcupacao[] = (eventosLocais ?? []).map((e) => ({
    title: e.title,
    startsAt: new Date(e.starts_at),
    endsAt: new Date(e.ends_at),
    isAllDay: e.is_all_day,
    transparency: e.transparency,
    status: e.status,
    attendeeResponse: e.attendee_response,
    criadoPelaPlataforma: Boolean((e.raw as any)?.extendedProperties?.private?.[CHAVE_MARCADOR_AULA]),
  }));

  const intervalosLocais = calcularIntervalosOcupados(eventos, {
    ignorarDiaInteiro: conta.ignorar_dia_inteiro,
  });
  let conflito = encontrarConflito(intervalosLocais, inicio, fim);
  if (conflito) return { contaConectada: true, conflito };

  const tokenResultado = await obterAccessTokenValido(supabase, conta.id);
  if (!tokenResultado.ok) {
    // sem token válido, fica só com o que o espelho local já tinha.
    return { contaConectada: true, conflito: null };
  }

  const calendarios =
    conta.calendarios_selecionados.length > 0
      ? conta.calendarios_selecionados
      : [conta.primary_calendar_id].filter(Boolean);

  if (calendarios.length === 0) {
    return { contaConectada: true, conflito: null };
  }

  const freeBusy = await consultarFreeBusy({
    accessToken: tokenResultado.accessToken,
    calendarIds: calendarios as string[],
    timeMin: inicio.toISOString(),
    timeMax: fim.toISOString(),
  });

  if (!freeBusy.ok) {
    // Google fora do ar/instável não pode travar o agendamento —
    // fica com o resultado do espelho local mesmo.
    return { contaConectada: true, conflito: null };
  }

  // freeBusy.query só devolve intervalos, sem título nem
  // extendedProperties do evento — não dá pra excluir eventos criados
  // pela própria plataforma aqui como fazemos no espelho local acima.
  // Não é um problema hoje (só existe agendamento de aula NOVA, sem
  // conflito possível contra si mesma); vira relevante se um dia
  // existir reagendar/editar horário — nesse caso, cancelar o evento
  // antigo antes de checar o novo horário evita o auto-conflito.
  const intervalosAoVivo: IntervaloOcupado[] = Object.values(freeBusy.data)
    .flat()
    .map((b) => ({ titulo: null, inicio: new Date(b.start), fim: new Date(b.end) }));

  conflito = encontrarConflito(intervalosAoVivo, inicio, fim);
  return { contaConectada: true, conflito };
}
