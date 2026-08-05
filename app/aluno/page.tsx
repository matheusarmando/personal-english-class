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

  const { data: presencas } = await supabase
    .from("presencas")
    .select("presente, aulas(titulo, data, turmas(nome))")
    .eq("aluno_id", profile?.id)
    .order("created_at", { ascending: false });

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
        <Link href="/aluno/financeiro" className="text-sm font-semibold text-accent hover:underline">
          Ver financeiro
        </Link>
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

      <section className="max-w-xl">
        <h2 className="font-display font-semibold text-lg mb-3">Minha frequência</h2>
        {!presencas || presencas.length === 0 ? (
          <p className="text-sm text-ink/60">
            Nenhum registro de presença ainda.
          </p>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white/60">
            {presencas.map((p: any, i: number) => (
              <li key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{p.aulas?.titulo}</p>
                  <p className="text-xs text-ink/50">
                    {p.aulas?.turmas?.nome} · {p.aulas?.data}
                  </p>
                </div>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    p.presente ? "bg-good/15 text-good" : "bg-bad/15 text-bad"
                  }`}
                >
                  {p.presente ? "Presente" : "Ausente"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
