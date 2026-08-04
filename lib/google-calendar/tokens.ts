import type { SupabaseClient } from "@supabase/supabase-js";
import { renovarAccessToken } from "./client";
import { atualizarSegredo, lerSegredo } from "./vault";

const MARGEM_EXPIRACAO_MS = 2 * 60 * 1000;

export type ResultadoAccessToken =
  | { ok: true; accessToken: string }
  | { ok: false; erro: string; reautorizacaoNecessaria: boolean };

/**
 * Devolve um access token válido pra conta, renovando via refresh
 * token quando necessário. Se o Google recusar o refresh com
 * `invalid_grant` (usuário revogou o acesso pelo lado do Google), a
 * conta é marcada como `reauth_necessario` pra UI avisar o professor.
 */
export async function obterAccessTokenValido(
  supabase: SupabaseClient,
  accountId: string
): Promise<ResultadoAccessToken> {
  const { data: conta, error } = await supabase
    .from("google_calendar_accounts")
    .select("access_token_secret_id, refresh_token_secret_id, token_expires_at")
    .eq("id", accountId)
    .single();

  if (error || !conta) {
    return { ok: false, erro: "Conta não encontrada.", reautorizacaoNecessaria: false };
  }

  const expiraEm = conta.token_expires_at ? new Date(conta.token_expires_at).getTime() : 0;
  const aindaValido = expiraEm - Date.now() > MARGEM_EXPIRACAO_MS;

  if (aindaValido && conta.access_token_secret_id) {
    const accessToken = await lerSegredo(supabase, conta.access_token_secret_id);
    if (accessToken) return { ok: true, accessToken };
  }

  if (!conta.refresh_token_secret_id) {
    return { ok: false, erro: "Conta sem refresh token.", reautorizacaoNecessaria: true };
  }

  const refreshToken = await lerSegredo(supabase, conta.refresh_token_secret_id);
  if (!refreshToken) {
    return { ok: false, erro: "Refresh token não encontrado no Vault.", reautorizacaoNecessaria: true };
  }

  const resultado = await renovarAccessToken({
    refreshToken,
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  });

  if (!resultado.ok) {
    const invalidGrant = resultado.erro === "invalid_grant";
    if (invalidGrant) {
      await supabase
        .from("google_calendar_accounts")
        .update({ status: "reauth_necessario" })
        .eq("id", accountId);
    }
    return { ok: false, erro: resultado.erro, reautorizacaoNecessaria: invalidGrant };
  }

  const novaExpiracao = new Date(Date.now() + resultado.data.expiresInSegundos * 1000).toISOString();

  if (conta.access_token_secret_id) {
    await atualizarSegredo(supabase, conta.access_token_secret_id, resultado.data.accessToken);
  }

  await supabase
    .from("google_calendar_accounts")
    .update({ token_expires_at: novaExpiracao })
    .eq("id", accountId);

  return { ok: true, accessToken: resultado.data.accessToken };
}
