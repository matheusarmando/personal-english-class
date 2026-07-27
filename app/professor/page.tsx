import { createClient, getProfile } from "@/lib/supabase/server";
import { criarAula } from "./actions";
import ListaChamada from "@/components/ListaChamada";
import CalendarioMensal from "@/components/CalendarioMensal";
import {
  chaveDia,
  resolverMesReferencia,
  LABEL_TIPO_AGENDAMENTO,
  type AulaDoDia,
} from "@/lib/calendario";

export default async function ProfessorPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const mesRef = resolverMesReferencia(searchParams.mes);
  const inicioMes = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
  const fimMes = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);

  const { data: meusAlunos } = await supabase
    .from("alunos")
    .select("id, nome, link_aula, valor, status_pagamento, pix_copia_cola")
    .eq("professor_id", profile?.id);

  const alunoIds = (meusAlunos ?? []).map((a) => a.id);
  const dadosPorAlunoId = new Map((meusAlunos ?? []).map((a) => [a.id, a]));

  const { data: horariosDoMes } = alunoIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("id, data_hora, aluno_id")
        .in("aluno_id", alunoIds)
        .gte("data_hora", inicioMes.toISOString())
        .lt("data_hora", fimMes.toISOString())
        .order("data_hora")
    : { data: [] };

  const aulasPorDia: Record<string, AulaDoDia[]> = {};
  for (const h of horariosDoMes ?? []) {
    const dt = new Date(h.data_hora);
    const chave = chaveDia(dt);
    const hora = dt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const aluno = dadosPorAlunoId.get(h.aluno_id);
    (aulasPorDia[chave] ??= []).push({
      id: h.id,
      hora,
      titulo: aluno?.nome ?? "Aluno",
      linkAula: aluno?.link_aula,
      valor: aluno?.valor,
      statusPagamento: aluno?.status_pagamento,
      pixCopiaCola: aluno?.pix_copia_cola,
    });
  }

  const { data: agendamentosDoMes } = await supabase
    .from("agendamentos_avulsos")
    .select("id, nome, tipo, data_hora, email, telefone, observacoes")
    .eq("professor_id", profile?.id)
    .gte("data_hora", inicioMes.toISOString())
    .lt("data_hora", fimMes.toISOString())
    .order("data_hora");

  for (const a of agendamentosDoMes ?? []) {
    const dt = new Date(a.data_hora);
    const chave = chaveDia(dt);
    const hora = dt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const contato = [a.email, a.telefone].filter(Boolean).join(" · ");
    (aulasPorDia[chave] ??= []).push({
      id: a.id,
      hora,
      titulo: `${LABEL_TIPO_AGENDAMENTO[a.tipo] ?? a.tipo} — ${a.nome}`,
      contato: contato || null,
      observacoes: a.observacoes,
    });
  }

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome")
    .eq("professor_id", profile?.id);

  const primeiraTurma = turmas?.[0];

  const { data: aulas } = primeiraTurma
    ? await supabase
        .from("aulas")
        .select("id, titulo, data")
        .eq("turma_id", primeiraTurma.id)
        .order("data", { ascending: false })
    : { data: [] };

  const primeiraAula = aulas?.[0];

  let alunos: { id: string; nome: string; presente: boolean | null }[] = [];
  if (primeiraAula && primeiraTurma) {
    const { data: matriculados } = await supabase
      .from("matriculas")
      .select("profiles(id, nome)")
      .eq("turma_id", primeiraTurma.id);

    const { data: presencas } = await supabase
      .from("presencas")
      .select("aluno_id, presente")
      .eq("aula_id", primeiraAula.id);

    alunos = (matriculados ?? []).map((m: any) => ({
      id: m.profiles.id,
      nome: m.profiles.nome,
      presente:
        presencas?.find((p) => p.aluno_id === m.profiles.id)?.presente ??
        null,
    }));
  }

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display text-3xl mb-8">Olá, {profile?.nome}</h1>

      <section className="max-w-3xl mb-10">
        <h2 className="font-display text-lg mb-3">Aulas do mês</h2>
        <CalendarioMensal
          mesRef={mesRef}
          aulasPorDia={aulasPorDia}
          baseHref="/professor"
        />
      </section>

      {!primeiraTurma ? (
        <p className="text-sm text-ink/60">
          Você ainda não tem turmas atribuídas. Peça à gestão para vincular
          uma turma ao seu perfil.
        </p>
      ) : (
        <div className="max-w-xl space-y-8">
          <section>
            <h2 className="font-display text-lg mb-3">
              Nova aula — {primeiraTurma.nome}
            </h2>
            <form action={criarAula} className="flex gap-2 flex-wrap">
              <input type="hidden" name="turma_id" value={primeiraTurma.id} />
              <input
                name="titulo"
                placeholder="Título da aula"
                required
                className="flex-1 min-w-[10rem] rounded-lg border border-line bg-white px-3 py-2 text-sm"
              />
              <input
                name="data"
                type="date"
                required
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-full bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
              >
                Criar aula
              </button>
            </form>
          </section>

          {primeiraAula && (
            <section>
              <h2 className="font-display text-lg mb-3">
                Chamada — {primeiraAula.titulo} ({primeiraAula.data})
              </h2>
              {alunos.length === 0 ? (
                <p className="text-sm text-ink/60">
                  Nenhum aluno matriculado nesta turma ainda.
                </p>
              ) : (
                <ListaChamada aulaId={primeiraAula.id} alunos={alunos} />
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
