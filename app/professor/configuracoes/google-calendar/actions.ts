"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { pararWatch, revogarToken } from "@/lib/google-calendar/client";
import { lerSegredo, removerSegredo } from "@/lib/google-calendar/vault";
import { obterAccessTokenValido } from "@/lib/google-calendar/tokens";

export async function desconectarGoogleCalendar() {
  const profile = await getProfile();
  if (!profile) return;

  const admin = createAdminClient();
  const { data: conta } = await admin
    .from("google_calendar_accounts")
    .select(
      "id, access_token_secret_id, refresh_token_secret_id, watch_channel_id, watch_resource_id, watch_channel_token_secret_id"
    )
    .eq("professor_id", profile.id)
    .maybeSingle();

  if (!conta) return;

  const tokenResultado = await obterAccessTokenValido(admin, conta.id);

  if (conta.watch_channel_id && conta.watch_resource_id && tokenResultado.ok) {
    await pararWatch({
      accessToken: tokenResultado.accessToken,
      channelId: conta.watch_channel_id,
      resourceId: conta.watch_resource_id,
    }).catch(() => {});
  }

  if (tokenResultado.ok) {
    await revogarToken(tokenResultado.accessToken).catch(() => {});
  }
  if (conta.refresh_token_secret_id) {
    const refreshToken = await lerSegredo(admin, conta.refresh_token_secret_id);
    if (refreshToken) await revogarToken(refreshToken).catch(() => {});
  }

  for (const secretId of [conta.access_token_secret_id, conta.refresh_token_secret_id, conta.watch_channel_token_secret_id]) {
    if (secretId) await removerSegredo(admin, secretId).catch(() => {});
  }

  // apaga a conta e, em cascata, o espelho de eventos.
  await admin.from("google_calendar_accounts").delete().eq("id", conta.id);

  revalidatePath("/professor/configuracoes/google-calendar");
}

export async function atualizarConfiguracoesGoogleCalendar(formData: FormData) {
  const profile = await getProfile();
  if (!profile) return;

  const admin = createAdminClient();
  const ignorarDiaInteiro = formData.get("ignorar_dia_inteiro") === "on";
  const ocultarTituloParaAluno = formData.get("ocultar_titulo_para_aluno") === "on";
  const calendariosSelecionados = formData.getAll("calendarios_selecionados") as string[];

  await admin
    .from("google_calendar_accounts")
    .update({
      ignorar_dia_inteiro: ignorarDiaInteiro,
      ocultar_titulo_para_aluno: ocultarTituloParaAluno,
      calendarios_selecionados: calendariosSelecionados,
    })
    .eq("professor_id", profile.id);

  revalidatePath("/professor/configuracoes/google-calendar");
}
