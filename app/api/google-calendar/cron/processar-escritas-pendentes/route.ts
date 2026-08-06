import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sincronizarCriacaoDaAula } from "@/lib/google-calendar/escrita";
import { DURACAO_PADRAO_AULA_MINUTOS } from "@/lib/calendario";

export const dynamic = "force-dynamic";

function autorizado(request: Request) {
  const auth = request.headers.get("authorization");
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
}

const MAX_TENTATIVAS = 5;
const FK_PROFESSOR = "profiles!alunos_professor_id_fkey";

/**
 * Reprocessa aulas cuja sincronização de escrita com o Google Calendar
 * ficou pendente — a tentativa inline feita na criação (ver
 * adicionarHorario) falhou ou não conseguiu concluir a tempo. Roda a
 * cada poucos minutos via pg_cron; o cron nativo da Vercel (plano
 * Hobby) só permite 1x/dia, não cobre esse caso (mesmo motivo do
 * fallback de leitura em sincronizar-pendentes).
 *
 * Só cancelamento não passa por aqui — depois de removerHorario a
 * linha de aluno_horarios não existe mais pra guardar `pendente`
 * (ver comentário em lib/google-calendar/escrita.ts).
 */
export async function POST(request: Request) {
  if (!autorizado(request)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data: pendentes } = await admin
    .from("aluno_horarios")
    .select(`id, data_hora, link_aula, alunos(nome, professor_id, link_aula, ${FK_PROFESSOR}(timezone))`)
    .eq("google_sync_status", "pendente")
    .lt("google_sync_tentativas", MAX_TENTATIVAS)
    .neq("status", "cancelada");

  let reprocessadas = 0;

  for (const horario of pendentes ?? []) {
    const aluno: any = horario.alunos;
    if (!aluno) continue;

    const inicio = new Date(horario.data_hora);
    const fim = new Date(inicio.getTime() + DURACAO_PADRAO_AULA_MINUTOS * 60 * 1000);

    await sincronizarCriacaoDaAula(admin, aluno.professor_id, {
      aulaId: horario.id,
      tipo: "regular",
      titulo: `Aula com ${aluno.nome}`,
      inicio,
      fim,
      timeZone: aluno.profiles?.timezone ?? "America/Sao_Paulo",
      linkAula: horario.link_aula ?? aluno.link_aula,
    });
    reprocessadas++;
  }

  return NextResponse.json({ reprocessadas });
}
