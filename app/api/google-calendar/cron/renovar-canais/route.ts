import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { registrarWatchPrimario } from "@/lib/google-calendar/watch";

export const dynamic = "force-dynamic";

function autorizado(request: Request) {
  const auth = request.headers.get("authorization");
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
}

/** Chamada 1x/dia pelo cron da Vercel — renova canais de push perto de expirar (~7 dias). */
export async function GET(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const em48h = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

  const { data: contas } = await admin
    .from("google_calendar_accounts")
    .select("id")
    .eq("status", "conectado")
    .lt("watch_expires_at", em48h);

  let renovados = 0;
  for (const conta of contas ?? []) {
    await registrarWatchPrimario(admin, conta.id);
    renovados++;
  }

  return NextResponse.json({ renovados });
}
