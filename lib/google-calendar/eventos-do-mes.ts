import { createAdminClient } from "@/lib/supabase/admin";
import { calcularIntervalosOcupados } from "./ocupacao";
import { chaveDia } from "@/lib/calendario";

export type EventoGoogleDoDia = { hora: string; titulo: string };

/**
 * Busca os compromissos do Google Calendar do professor num período,
 * já agrupados por dia. Nunca lança erro — Google desconectado, mal
 * configurado (ex.: faltam variáveis de ambiente do admin client) ou
 * indisponível só significa "sem enriquecimento agora", nunca pode
 * derrubar a página que chama isso.
 */
export async function buscarEventosGooglePorDia(
  professorId: string | undefined,
  inicioMes: Date,
  fimMes: Date
): Promise<Record<string, EventoGoogleDoDia[]>> {
  const eventosGooglePorDia: Record<string, EventoGoogleDoDia[]> = {};
  if (!professorId) return eventosGooglePorDia;

  try {
    const admin = createAdminClient();

    const { data: contaGoogle } = await admin
      .from("google_calendar_accounts")
      .select("id, ignorar_dia_inteiro")
      .eq("professor_id", professorId)
      .eq("status", "conectado")
      .maybeSingle();

    if (!contaGoogle) return eventosGooglePorDia;

    const { data: eventosGoogleRaw } = await admin
      .from("google_calendar_events")
      .select("title, starts_at, ends_at, is_all_day, transparency, status, attendee_response")
      .eq("account_id", contaGoogle.id)
      .lt("starts_at", fimMes.toISOString())
      .gte("ends_at", inicioMes.toISOString());

    const intervalosOcupados = calcularIntervalosOcupados(
      (eventosGoogleRaw ?? []).map((e) => ({
        title: e.title,
        startsAt: new Date(e.starts_at),
        endsAt: new Date(e.ends_at),
        isAllDay: e.is_all_day,
        transparency: e.transparency,
        status: e.status,
        attendeeResponse: e.attendee_response,
      })),
      { ignorarDiaInteiro: contaGoogle.ignorar_dia_inteiro }
    );

    for (const intervalo of intervalosOcupados) {
      const chave = chaveDia(intervalo.inicio);
      const hora = intervalo.inicio.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
      (eventosGooglePorDia[chave] ??= []).push({ hora, titulo: intervalo.titulo ?? "Ocupado" });
    }
  } catch (erro) {
    console.error("Falha ao buscar eventos do Google Calendar (ignorado):", erro);
  }

  return eventosGooglePorDia;
}
