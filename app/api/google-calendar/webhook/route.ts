import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { lerSegredo } from "@/lib/google-calendar/vault";
import { sincronizarConta } from "@/lib/google-calendar/sync";

export const dynamic = "force-dynamic";

/**
 * Notificação de push do Google (`events.watch`). Valida o canal
 * pelo token compartilhado (não só o channel id, que é previsível) e
 * dispara sincronização incremental — que já é idempotente por
 * design, então uma notificação duplicada não duplica evento nem faz
 * mal nenhum.
 */
export async function POST(request: Request) {
  const channelId = request.headers.get("x-goog-channel-id");
  const channelToken = request.headers.get("x-goog-channel-token");

  if (!channelId || !channelToken) {
    return NextResponse.json({ error: "cabeçalhos ausentes" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: conta } = await admin
    .from("google_calendar_accounts")
    .select("id, watch_channel_token_secret_id")
    .eq("watch_channel_id", channelId)
    .maybeSingle();

  if (!conta || !conta.watch_channel_token_secret_id) {
    // canal de uma conta já desconectada — responde 200 pro Google
    // parar de reenviar, sem processar nada.
    return NextResponse.json({ ok: true });
  }

  const tokenEsperado = await lerSegredo(admin, conta.watch_channel_token_secret_id);
  if (channelToken !== tokenEsperado) {
    return NextResponse.json({ error: "token de canal inválido" }, { status: 403 });
  }

  await sincronizarConta(admin, conta.id);

  return NextResponse.json({ ok: true });
}
