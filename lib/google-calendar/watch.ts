import type { SupabaseClient } from "@supabase/supabase-js";
import { randomUUID, randomBytes } from "crypto";
import { pararWatch, registrarWatch } from "./client";
import { obterAccessTokenValido } from "./tokens";
import { removerSegredo, salvarSegredo } from "./vault";

/**
 * Registra o `events.watch` (push notification) só pro calendário
 * primário da conta — o Google exige um canal por calendário, e
 * sincronizar N calendários exigiria N canais/webhooks pra gerenciar
 * renovação de cada um. A sincronização em si (`sync.ts`) já cobre
 * todos os calendários selecionados independente disso; o push só
 * acelera a detecção de mudança no primário — os demais (e o próprio
 * primário, como fallback) dependem do job periódico de qualquer
 * forma. Erro aqui nunca derruba a conexão da conta.
 */
export async function registrarWatchPrimario(supabase: SupabaseClient, accountId: string): Promise<void> {
  const { data: conta } = await supabase
    .from("google_calendar_accounts")
    .select("primary_calendar_id, watch_channel_id, watch_resource_id, watch_channel_token_secret_id")
    .eq("id", accountId)
    .single();

  if (!conta?.primary_calendar_id) return;

  const tokenResultado = await obterAccessTokenValido(supabase, accountId);
  if (!tokenResultado.ok) return;

  if (conta.watch_channel_id && conta.watch_resource_id) {
    await pararWatch({
      accessToken: tokenResultado.accessToken,
      channelId: conta.watch_channel_id,
      resourceId: conta.watch_resource_id,
    });
  }

  const origem = new URL(process.env.GOOGLE_REDIRECT_URI!).origin;
  const webhookUrl = `${origem}/api/google-calendar/webhook`;
  const channelId = randomUUID();
  const channelToken = randomBytes(24).toString("hex");
  const channelTokenSecretId = await salvarSegredo(supabase, channelToken, `gcal_watch_token_${accountId}`);

  const resultado = await registrarWatch({
    accessToken: tokenResultado.accessToken,
    calendarId: conta.primary_calendar_id,
    channelId,
    channelToken,
    webhookUrl,
  });

  if (!resultado.ok) {
    await removerSegredo(supabase, channelTokenSecretId).catch(() => {});
    return;
  }

  if (conta.watch_channel_token_secret_id) {
    await removerSegredo(supabase, conta.watch_channel_token_secret_id).catch(() => {});
  }

  await supabase
    .from("google_calendar_accounts")
    .update({
      watch_channel_id: channelId,
      watch_resource_id: resultado.data.resourceId,
      watch_channel_token_secret_id: channelTokenSecretId,
      watch_expires_at: new Date(Number(resultado.data.expiration)).toISOString(),
    })
    .eq("id", accountId);
}
