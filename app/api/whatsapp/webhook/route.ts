import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Handshake de verificação exigido pela Meta ao cadastrar a URL do webhook. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WHATSAPP_VERIFY_TOKEN && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "verificação inválida" }, { status: 403 });
}

/**
 * Recebe eventos de status de entrega da Meta. Só tratamos falhas —
 * "enviada" já é marcado no momento do envio pelo cron; entrega/leitura
 * não têm um estado próprio no nosso enum simplificado.
 */
export async function POST(request: Request) {
  const body = await request.json();
  const supabase = createAdminClient();

  const changes = body?.entry?.flatMap((e: any) => e.changes ?? []) ?? [];

  for (const change of changes) {
    const statuses = change?.value?.statuses ?? [];
    for (const status of statuses) {
      if (status.status !== "failed") continue;

      const erro = status.errors?.[0]?.title ?? "Falha reportada pela Meta";
      await supabase
        .from("whatsapp_mensagens")
        .update({ status: "falhou", erro })
        .eq("whatsapp_message_id", status.id);
    }
  }

  return NextResponse.json({ ok: true });
}
