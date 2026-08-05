import { createHmac, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

/** Handshake de verificação exigido pela Meta ao cadastrar a URL do webhook. */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && verificacaoValida(token) && challenge) {
    return new NextResponse(challenge, { status: 200 });
  }

  return NextResponse.json({ error: "verificação inválida" }, { status: 403 });
}

function verificacaoValida(token: string | null): boolean {
  const esperado = process.env.WHATSAPP_VERIFY_TOKEN;
  if (!token || !esperado) return false;
  const bufToken = Buffer.from(token);
  const bufEsperado = Buffer.from(esperado);
  return bufToken.length === bufEsperado.length && timingSafeEqual(bufToken, bufEsperado);
}

/**
 * A Meta assina cada POST de webhook com HMAC-SHA256 do corpo cru,
 * usando o App Secret, no header X-Hub-Signature-256 (formato
 * "sha256=<hex>"). Sem checar isso, qualquer request forjada com a
 * URL do webhook consegue escrever em whatsapp_mensagens via
 * createAdminClient() (service_role, ignora RLS) — daí a assinatura
 * ser obrigatória antes de processar qualquer coisa do corpo.
 */
function assinaturaValida(corpoCru: string, assinaturaRecebida: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !assinaturaRecebida) return false;

  const esperada = "sha256=" + createHmac("sha256", appSecret).update(corpoCru).digest("hex");
  const bufRecebida = Buffer.from(assinaturaRecebida);
  const bufEsperada = Buffer.from(esperada);
  return bufRecebida.length === bufEsperada.length && timingSafeEqual(bufRecebida, bufEsperada);
}

/**
 * Recebe eventos de status de entrega da Meta. Só tratamos falhas —
 * "enviada" já é marcado no momento do envio pelo cron; entrega/leitura
 * não têm um estado próprio no nosso enum simplificado.
 */
export async function POST(request: Request) {
  const corpoCru = await request.text();

  if (!assinaturaValida(corpoCru, request.headers.get("x-hub-signature-256"))) {
    return NextResponse.json({ error: "assinatura inválida" }, { status: 403 });
  }

  const body = JSON.parse(corpoCru);
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
