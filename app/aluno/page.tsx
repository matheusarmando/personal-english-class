import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import CalendarioMensal from "@/components/CalendarioMensal";
import WidgetNotificacoes from "@/components/WidgetNotificacoes";
import { chaveDia, resolverMesReferencia, type AulaDoDia } from "@/lib/calendario";

export default async function AlunoPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const mesRef = resolverMesReferencia(searchParams.mes);
  const inicioMes = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
  const fimMes = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);

  const { data: meuRegistroAluno } = await supabase
    .from("alunos")
    .select("id, link_aula")
    .eq("profile_id", profile?.id);

  const meusRegistros = meuRegistroAluno ?? [];
  const meusRegistroIds = meusRegistros.map((a) => a.id);
  const dadosPorRegistroId = new Map(meusRegistros.map((a) => [a.id, a]));

  const { data: horariosDoMes } = meusRegistroIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("id, data_hora, aluno_id, link_aula")
        .in("aluno_id", meusRegistroIds)
        .neq("status", "cancelada")
        .gte("data_hora", inicioMes.toISOString())
        .lt("data_hora", fimMes.toISOString())
        .order("data_hora")
    : { data: [] };

  const aulasPorDia: Record<string, AulaDoDia[]> = {};
  for (const h of horariosDoMes ?? []) {
    const dt = new Date(h.data_hora);
    const hora = dt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const registro = dadosPorRegistroId.get(h.aluno_id);
    (aulasPorDia[chaveDia(dt)] ??= []).push({
      id: h.id,
      hora,
      titulo: "Aula agendada",
      linkAula: h.link_aula ?? registro?.link_aula,
    });
  }

  const { data: notificacoes } = await supabase
    .from("notificacoes")
    .select("id, titulo, mensagem, tipo")
    .eq("destinatario_id", profile?.id)
    .eq("lida", false)
    .order("created_at", { ascending: false })
    .limit(10);

  const avisosFinanceiros = (notificacoes ?? []).filter((n) => n.tipo !== "aviso_professor");
  const avisosProfessor = (notificacoes ?? []).filter((n) => n.tipo === "aviso_professor");

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-display font-semibold text-3xl">Olá, {profile?.nome}</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/aluno/frequencia"
            className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-accent transition-colors"
          >
            Ver frequência
          </Link>
          <Link
            href="/aluno/financeiro"
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
          >
            Ver financeiro
          </Link>
        </div>
      </div>

      <section className="max-w-3xl mb-8 grid sm:grid-cols-2 gap-4">
        <WidgetNotificacoes titulo="Avisos do professor" notificacoes={avisosProfessor} />
        <WidgetNotificacoes titulo="Avisos financeiros" notificacoes={avisosFinanceiros} />
      </section>

      <section className="max-w-3xl mb-10">
        <h2 className="font-display font-semibold text-lg mb-3">Minhas aulas do mês</h2>
        <CalendarioMensal
          mesRef={mesRef}
          aulasPorDia={aulasPorDia}
          baseHref="/aluno"
          permitirSolicitarAgendamento
        />
      </section>
    </main>
  );
}
