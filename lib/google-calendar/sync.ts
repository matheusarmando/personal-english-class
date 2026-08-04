import type { SupabaseClient } from "@supabase/supabase-js";
import { listarEventos } from "./client";
import { obterAccessTokenValido } from "./tokens";
import type { EventoGoogle } from "./tipos";

const JANELA_PASSADO_DIAS = 30;
const JANELA_FUTURO_DIAS = 365;

function paraTimestamptz(evento: EventoGoogle["start"]): { valor: string; isAllDay: boolean } {
  if (evento.dateTime) return { valor: evento.dateTime, isAllDay: false };
  // evento de dia inteiro só tem "date" (YYYY-MM-DD, sem hora/fuso).
  return { valor: `${evento.date}T00:00:00Z`, isAllDay: true };
}

function paraLinhaEvento(accountId: string, calendarId: string, evento: EventoGoogle) {
  const inicio = paraTimestamptz(evento.start);
  const fim = paraTimestamptz(evento.end);
  const respostaProprio = evento.attendees?.find((a) => a.self)?.responseStatus ?? null;

  return {
    account_id: accountId,
    google_event_id: evento.id,
    calendar_id: calendarId,
    title: evento.summary ?? null,
    starts_at: inicio.valor,
    ends_at: fim.valor,
    is_all_day: inicio.isAllDay,
    timezone: evento.start.timeZone ?? null,
    transparency: evento.transparency ?? "opaque",
    status: evento.status,
    attendee_response: respostaProprio,
    etag: evento.etag ?? null,
    updated_at: evento.updated ?? new Date().toISOString(),
    raw: evento,
  };
}

async function registrarLog(
  supabase: SupabaseClient,
  accountId: string,
  tipoOperacao: string,
  resultado: "sucesso" | "erro",
  erro: string | null,
  duracaoMs: number
) {
  await supabase.from("google_sync_logs").insert({
    account_id: accountId,
    tipo_operacao: tipoOperacao,
    resultado,
    erro,
    duracao_ms: duracaoMs,
  });
}

async function sincronizarCalendario(
  supabase: SupabaseClient,
  accountId: string,
  calendarId: string,
  accessToken: string,
  syncTokenAtual: string | undefined
): Promise<{ novoSyncToken: string | null; precisaRecarregarTudo: boolean }> {
  let pageToken: string | undefined;
  let novoSyncToken: string | null = null;

  const agora = new Date();
  const timeMin = new Date(agora.getTime() - JANELA_PASSADO_DIAS * 86400000).toISOString();
  const timeMax = new Date(agora.getTime() + JANELA_FUTURO_DIAS * 86400000).toISOString();

  do {
    const resultado = await listarEventos({
      accessToken,
      calendarId,
      syncToken: syncTokenAtual,
      pageToken,
      timeMin: syncTokenAtual ? undefined : timeMin,
      timeMax: syncTokenAtual ? undefined : timeMax,
    });

    if (!resultado.ok) {
      if (resultado.status === 410) {
        // syncToken expirado/inválido — descarta e quem chamou refaz a carga completa.
        return { novoSyncToken: null, precisaRecarregarTudo: true };
      }
      throw new Error(resultado.erro);
    }

    for (const evento of resultado.data.items) {
      if (evento.status === "cancelled") {
        await supabase
          .from("google_calendar_events")
          .delete()
          .eq("account_id", accountId)
          .eq("google_event_id", evento.id);
        continue;
      }

      await supabase
        .from("google_calendar_events")
        .upsert(paraLinhaEvento(accountId, calendarId, evento), { onConflict: "account_id,google_event_id" });
    }

    pageToken = resultado.data.nextPageToken;
    if (resultado.data.nextSyncToken) novoSyncToken = resultado.data.nextSyncToken;
  } while (pageToken);

  return { novoSyncToken, precisaRecarregarTudo: false };
}

/**
 * Sincroniza uma conta: carga inicial (sem syncToken) ou incremental
 * (com syncToken; em 410 refaz a carga completa daquele calendário).
 * Cobre TODOS os calendários selecionados pelo professor — o
 * `events.watch` (push) só é registrado pro calendário primário
 * (ver `watch.ts`), mas a sincronização em si, aqui, não depende
 * disso: o job de fallback chama esta mesma função pra qualquer
 * calendário selecionado.
 */
export async function sincronizarConta(supabase: SupabaseClient, accountId: string): Promise<void> {
  const inicio = Date.now();

  const { data: conta } = await supabase
    .from("google_calendar_accounts")
    .select("id, primary_calendar_id, calendarios_selecionados, sync_tokens")
    .eq("id", accountId)
    .single();

  if (!conta) return;

  const tokenResultado = await obterAccessTokenValido(supabase, accountId);
  if (!tokenResultado.ok) {
    await registrarLog(supabase, accountId, "incremental_sync", "erro", tokenResultado.erro, Date.now() - inicio);
    return;
  }

  const calendarios: string[] =
    conta.calendarios_selecionados.length > 0
      ? conta.calendarios_selecionados
      : [conta.primary_calendar_id].filter(Boolean);

  const syncTokens: Record<string, string> = { ...(conta.sync_tokens ?? {}) };
  let houveErro: string | null = null;

  for (const calendarId of calendarios) {
    try {
      let { novoSyncToken, precisaRecarregarTudo } = await sincronizarCalendario(
        supabase,
        accountId,
        calendarId,
        tokenResultado.accessToken,
        syncTokens[calendarId]
      );

      if (precisaRecarregarTudo) {
        delete syncTokens[calendarId];
        const carga = await sincronizarCalendario(supabase, accountId, calendarId, tokenResultado.accessToken, undefined);
        novoSyncToken = carga.novoSyncToken;
      }

      if (novoSyncToken) syncTokens[calendarId] = novoSyncToken;
    } catch (err) {
      houveErro = err instanceof Error ? err.message : "erro desconhecido";
    }
  }

  await supabase.from("google_calendar_accounts").update({ sync_tokens: syncTokens }).eq("id", accountId);

  await registrarLog(
    supabase,
    accountId,
    "incremental_sync",
    houveErro ? "erro" : "sucesso",
    houveErro,
    Date.now() - inicio
  );
}
