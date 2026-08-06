import type { SupabaseClient } from "@supabase/supabase-js";
import { atualizarEvento, buscarEventoPorPropriedade, cancelarEvento, criarEvento } from "./client";
import { obterAccessTokenValido } from "./tokens";
import { construirPayloadEvento, type AulaParaEvento } from "./eventos-para-google";
import { CHAVE_MARCADOR_AULA } from "./constantes";

const MAX_TENTATIVAS = 5;

/** Pura, testável sem banco: decide o próximo status/contador após uma falha. */
export function calcularProximoStatusTentativa(
  tentativasAtuais: number
): { status: "pendente" | "falhou"; tentativas: number } {
  const tentativas = tentativasAtuais + 1;
  return { status: tentativas >= MAX_TENTATIVAS ? "falhou" : "pendente", tentativas };
}

async function marcarSucesso(
  supabase: SupabaseClient,
  aulaId: string,
  googleEventId: string,
  etag: string | null
): Promise<void> {
  await supabase
    .from("aluno_horarios")
    .update({
      google_event_id: googleEventId,
      google_event_etag: etag,
      google_sync_status: "sincronizado",
      google_sync_tentativas: 0,
      google_sync_ultimo_erro: null,
    })
    .eq("id", aulaId);
}

async function marcarTentativaFalha(supabase: SupabaseClient, aulaId: string, erro: string): Promise<void> {
  const { data } = await supabase
    .from("aluno_horarios")
    .select("google_sync_tentativas")
    .eq("id", aulaId)
    .maybeSingle();

  const { status, tentativas } = calcularProximoStatusTentativa(data?.google_sync_tentativas ?? 0);
  await supabase
    .from("aluno_horarios")
    .update({ google_sync_status: status, google_sync_tentativas: tentativas, google_sync_ultimo_erro: erro })
    .eq("id", aulaId);
}

/**
 * Cria (ou reconcilia, se uma tentativa anterior já criou no Google
 * mas caiu antes de gravar o id de volta) o evento no Google Calendar
 * pra uma aula. Nunca lança — toda falha vira 'pendente'/'falhou' pro
 * cron reprocessar depois; quem chama (a action de criar aula, ou o
 * próprio cron) nunca pode ficar bloqueado nem quebrar por causa
 * disso.
 */
export async function sincronizarCriacaoDaAula(
  supabase: SupabaseClient,
  professorId: string,
  aula: AulaParaEvento
): Promise<void> {
  const { data: conta } = await supabase
    .from("google_calendar_accounts")
    .select("id, primary_calendar_id, escrita_habilitada")
    .eq("professor_id", professorId)
    .eq("status", "conectado")
    .maybeSingle();

  // Sem conta conectada, sem opt-in de escrita ou sem calendário
  // primário conhecido: não é erro, só não há o que sincronizar.
  if (!conta || !conta.escrita_habilitada || !conta.primary_calendar_id) return;

  const tokenResultado = await obterAccessTokenValido(supabase, conta.id);
  if (!tokenResultado.ok) {
    await marcarTentativaFalha(supabase, aula.aulaId, tokenResultado.erro);
    return;
  }

  const existente = await buscarEventoPorPropriedade({
    accessToken: tokenResultado.accessToken,
    calendarId: conta.primary_calendar_id,
    chave: CHAVE_MARCADOR_AULA,
    valor: aula.aulaId,
  });

  if (existente.ok && existente.data) {
    await marcarSucesso(supabase, aula.aulaId, existente.data.id, existente.data.etag);
    return;
  }

  const resultado = await criarEvento({
    accessToken: tokenResultado.accessToken,
    calendarId: conta.primary_calendar_id,
    evento: construirPayloadEvento(aula),
  });

  if (!resultado.ok) {
    await marcarTentativaFalha(supabase, aula.aulaId, resultado.erro);
    return;
  }

  await marcarSucesso(supabase, aula.aulaId, resultado.data.id, resultado.data.etag);
}

/**
 * Atualiza (PATCH) o evento de uma aula que já foi sincronizada antes
 * — usado quando o professor aprova uma remarcação sugerida pelo
 * aluno (mesma linha de aluno_horarios, só muda data_hora; ver
 * aprovarSolicitacao). Preserva o mesmo google_event_id em vez de
 * cancelar+recriar, porque é exatamente isso que já acontece do lado
 * local (UPDATE na mesma linha, não delete+insert).
 *
 * Sem google_event_id ainda (aula nunca foi sincronizada) ou evento
 * 404/410 (professor apagou manualmente no Google): cai pra
 * sincronizarCriacaoDaAula, que já faz reconciliação por
 * extendedProperties antes de criar — nenhum código novo pra esse
 * caso, só reaproveita o que já existe.
 */
export async function sincronizarAtualizacaoDaAula(
  supabase: SupabaseClient,
  professorId: string,
  aula: AulaParaEvento,
  googleEventIdAtual: string | null,
  etagAtual: string | null
): Promise<void> {
  if (!googleEventIdAtual) {
    await sincronizarCriacaoDaAula(supabase, professorId, aula);
    return;
  }

  const { data: conta } = await supabase
    .from("google_calendar_accounts")
    .select("id, primary_calendar_id, escrita_habilitada")
    .eq("professor_id", professorId)
    .eq("status", "conectado")
    .maybeSingle();

  if (!conta || !conta.escrita_habilitada || !conta.primary_calendar_id) return;

  const tokenResultado = await obterAccessTokenValido(supabase, conta.id);
  if (!tokenResultado.ok) {
    await marcarTentativaFalha(supabase, aula.aulaId, tokenResultado.erro);
    return;
  }

  const resultado = await atualizarEvento({
    accessToken: tokenResultado.accessToken,
    calendarId: conta.primary_calendar_id,
    eventId: googleEventIdAtual,
    etag: etagAtual ?? undefined,
    evento: construirPayloadEvento(aula),
  });

  if (!resultado.ok) {
    if (resultado.erro === "evento_nao_encontrado") {
      await supabase
        .from("aluno_horarios")
        .update({ google_event_id: null, google_event_etag: null })
        .eq("id", aula.aulaId);
      await sincronizarCriacaoDaAula(supabase, professorId, aula);
      return;
    }
    await marcarTentativaFalha(supabase, aula.aulaId, resultado.erro);
    return;
  }

  await marcarSucesso(supabase, aula.aulaId, resultado.data.id, resultado.data.etag);
}

/**
 * Cancela (deleta) o evento espelhado de uma aula no Google. Recebe o
 * `google_event_id` direto, não busca pelo id da aula — quem chama
 * isso é sempre a própria action de remover, que já apaga a linha
 * local em seguida (ou antes); não há outbox por linha aqui, porque
 * depois de `removerHorario` a linha não existe mais pra guardar
 * `pendente`/tentativas. `cancelarEvento` já tem retry com backoff
 * embutido (`fetchComRetry`); se mesmo assim falhar, o evento fica
 * órfão no Google até o professor apagar manualmente — trade-off
 * aceito por ora (caso raro: só acontece se o Google estiver fora do
 * ar pelas ~4 tentativas inteiras da chamada). 404/410 (professor já
 * apagou manualmente lá) é tratado como sucesso pelo client — é o
 * estado final desejado.
 */
export async function sincronizarCancelamentoDaAula(
  supabase: SupabaseClient,
  professorId: string,
  googleEventId: string | null
): Promise<void> {
  if (!googleEventId) return;

  const { data: conta } = await supabase
    .from("google_calendar_accounts")
    .select("id, primary_calendar_id, escrita_habilitada")
    .eq("professor_id", professorId)
    .eq("status", "conectado")
    .maybeSingle();

  if (!conta || !conta.escrita_habilitada || !conta.primary_calendar_id) return;

  const tokenResultado = await obterAccessTokenValido(supabase, conta.id);
  if (!tokenResultado.ok) return;

  await cancelarEvento({
    accessToken: tokenResultado.accessToken,
    calendarId: conta.primary_calendar_id,
    eventId: googleEventId,
  });
}
