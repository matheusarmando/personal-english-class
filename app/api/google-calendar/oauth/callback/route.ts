import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { validarEstado } from "@/lib/google-calendar/oauth-state";
import { listarCalendarios, trocarCodigoPorTokens } from "@/lib/google-calendar/client";
import { salvarSegredo } from "@/lib/google-calendar/vault";
import { sincronizarConta } from "@/lib/google-calendar/sync";
import { registrarWatchPrimario } from "@/lib/google-calendar/watch";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const erroConsentimento = url.searchParams.get("error");

  const destino = new URL("/professor/configuracoes/google-calendar", request.url);

  function comErro(motivo: string) {
    destino.searchParams.set("erro", motivo);
    const resposta = NextResponse.redirect(destino);
    resposta.cookies.delete("gcal_pkce_verifier");
    return resposta;
  }

  if (erroConsentimento) return comErro("consentimento_negado");
  if (!code || !state) return comErro("parametros_invalidos");

  const estado = validarEstado(state);
  if (!estado.valido) return comErro("state_invalido");

  const verifier = cookies().get("gcal_pkce_verifier")?.value;
  if (!verifier) return comErro("sessao_oauth_expirada");

  const tokens = await trocarCodigoPorTokens({
    code,
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    redirectUri: process.env.GOOGLE_REDIRECT_URI!,
    codeVerifier: verifier,
  });

  if (!tokens.ok) return comErro("troca_token_falhou");
  if (!tokens.data.refreshToken) return comErro("sem_refresh_token");

  let admin: ReturnType<typeof createAdminClient>;
  try {
    admin = createAdminClient();
  } catch {
    return comErro("integracao_nao_configurada");
  }

  const calendarios = await listarCalendarios(tokens.data.accessToken);
  if (!calendarios.ok) return comErro("falha_ao_listar_calendarios");
  const primario = calendarios.data.find((c) => c.primary);

  const accessTokenSecretId = await salvarSegredo(
    admin,
    tokens.data.accessToken,
    `gcal_access_${estado.professorId}_${Date.now()}`
  );
  const refreshTokenSecretId = await salvarSegredo(
    admin,
    tokens.data.refreshToken,
    `gcal_refresh_${estado.professorId}_${Date.now()}`
  );

  const { data: conta, error } = await admin
    .from("google_calendar_accounts")
    .upsert(
      {
        professor_id: estado.professorId,
        google_account_email: primario?.id ?? "desconhecido",
        access_token_secret_id: accessTokenSecretId,
        refresh_token_secret_id: refreshTokenSecretId,
        token_expires_at: new Date(Date.now() + tokens.data.expiresInSegundos * 1000).toISOString(),
        scopes: tokens.data.scopes,
        primary_calendar_id: primario?.id ?? "primary",
        status: "conectado",
      },
      { onConflict: "professor_id" }
    )
    .select("id")
    .single();

  if (error || !conta) return comErro("falha_ao_salvar_conta");

  await sincronizarConta(admin, conta.id);
  await registrarWatchPrimario(admin, conta.id);

  const resposta = NextResponse.redirect(destino);
  resposta.cookies.delete("gcal_pkce_verifier");
  return resposta;
}
