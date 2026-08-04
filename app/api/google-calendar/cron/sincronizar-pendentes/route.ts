import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sincronizarConta } from "@/lib/google-calendar/sync";

export const dynamic = "force-dynamic";

function autorizado(request: Request) {
  const auth = request.headers.get("authorization");
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
}

const INTERVALO_MINIMO_MINUTOS = 35;

/**
 * Fallback obrigatório — chamado a cada 30min por um job `pg_cron`
 * (o cron da Vercel só permite 1x/dia no plano Hobby, não cobre
 * isso). A integração nunca pode depender só do webhook.
 */
export async function POST(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const limite = new Date(Date.now() - INTERVALO_MINIMO_MINUTOS * 60 * 1000).toISOString();

  const { data: contas } = await admin
    .from("google_calendar_accounts")
    .select("id")
    .in("status", ["conectado", "erro"]);

  let sincronizadas = 0;

  for (const conta of contas ?? []) {
    const { data: ultimoLog } = await admin
      .from("google_sync_logs")
      .select("created_at")
      .eq("account_id", conta.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (ultimoLog && ultimoLog.created_at > limite) continue;

    await sincronizarConta(admin, conta.id);
    sincronizadas++;
  }

  return NextResponse.json({ sincronizadas });
}
