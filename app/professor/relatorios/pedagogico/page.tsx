import { createClient, getProfile } from "@/lib/supabase/server";
import { periodoMesAtual } from "@/lib/periodo";
import FiltroPeriodo from "@/components/relatorios/FiltroPeriodo";
import EstadoVazio from "@/components/EstadoVazio";

type LinhaAluno = {
  id: string;
  nome: string;
  tarefasAtribuidas: number;
  tarefasEntregues: number;
  notaMediaTarefas: number | null;
  provasRespondidas: number;
  notaMediaProvas: number | null;
};

export default async function RelatorioPedagogicoPage({
  searchParams,
}: {
  searchParams: { de?: string; ate?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const padrao = periodoMesAtual();
  const dataInicio = searchParams.de || padrao.de;
  const dataFim = searchParams.ate || padrao.ate;
  const inicioTimestamp = `${dataInicio}T00:00:00.000Z`;
  const fimTimestamp = `${dataFim}T23:59:59.999Z`;

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  const listaAlunos = alunos ?? [];
  const alunoIds = listaAlunos.map((a) => a.id);

  // Tarefas: consideradas "do período" pelo prazo — reflete o que era esperado nesse intervalo.
  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, aluno_id, pontos")
    .eq("professor_id", profile?.id)
    .gte("prazo", dataInicio)
    .lte("prazo", dataFim);

  const listaTarefas = tarefas ?? [];
  const tarefaIds = listaTarefas.map((t) => t.id);
  const pontosPorTarefa = new Map(listaTarefas.map((t) => [t.id, t.pontos]));

  const { data: entregas } = tarefaIds.length
    ? await supabase.from("tarefa_entregas").select("tarefa_id, aluno_id, nota").in("tarefa_id", tarefaIds)
    : { data: [] };
  const entregaPorTarefaEAluno = new Map((entregas ?? []).map((e) => [`${e.tarefa_id}:${e.aluno_id}`, e]));

  // Provas: consideradas "do período" por quando o aluno respondeu.
  const { data: atribuicoesRespondidas } = alunoIds.length
    ? await supabase
        .from("prova_atribuicoes")
        .select("prova_id, aluno_id, nota, respondido_em")
        .in("aluno_id", alunoIds)
        .not("respondido_em", "is", null)
        .gte("respondido_em", inicioTimestamp)
        .lte("respondido_em", fimTimestamp)
    : { data: [] };

  const listaAtribuicoes = atribuicoesRespondidas ?? [];
  const provaIds = [...new Set(listaAtribuicoes.map((a) => a.prova_id))];

  const { data: questoes } = provaIds.length
    ? await supabase.from("prova_questoes").select("prova_id, pontos").in("prova_id", provaIds)
    : { data: [] };

  const pontosTotalPorProva = new Map<string, number>();
  for (const q of questoes ?? []) {
    pontosTotalPorProva.set(q.prova_id, (pontosTotalPorProva.get(q.prova_id) ?? 0) + q.pontos);
  }

  const linhas: LinhaAluno[] = listaAlunos.map((aluno) => {
    let tarefasAtribuidas = 0;
    let tarefasEntregues = 0;
    let somaPercentTarefas = 0;
    let quantidadeTarefasAvaliadas = 0;

    for (const t of listaTarefas) {
      const alvoDesteAluno = t.aluno_id === null || t.aluno_id === aluno.id;
      if (!alvoDesteAluno) continue;
      tarefasAtribuidas += 1;
      const entrega = entregaPorTarefaEAluno.get(`${t.id}:${aluno.id}`);
      if (entrega) {
        tarefasEntregues += 1;
        if (entrega.nota !== null && t.pontos > 0) {
          somaPercentTarefas += (entrega.nota / t.pontos) * 100;
          quantidadeTarefasAvaliadas += 1;
        }
      }
    }

    const atribuicoesDoAluno = listaAtribuicoes.filter((a) => a.aluno_id === aluno.id);
    let somaPercentProvas = 0;
    let quantidadeProvasComPontos = 0;
    for (const a of atribuicoesDoAluno) {
      const pontosTotal = pontosTotalPorProva.get(a.prova_id) ?? 0;
      if (pontosTotal > 0 && a.nota !== null) {
        somaPercentProvas += (a.nota / pontosTotal) * 100;
        quantidadeProvasComPontos += 1;
      }
    }

    return {
      id: aluno.id,
      nome: aluno.nome,
      tarefasAtribuidas,
      tarefasEntregues,
      notaMediaTarefas: quantidadeTarefasAvaliadas > 0 ? Math.round(somaPercentTarefas / quantidadeTarefasAvaliadas) : null,
      provasRespondidas: atribuicoesDoAluno.length,
      notaMediaProvas: quantidadeProvasComPontos > 0 ? Math.round(somaPercentProvas / quantidadeProvasComPontos) : null,
    };
  });

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Relatório pedagógico</h1>

      <div className="max-w-4xl">
        <FiltroPeriodo de={dataInicio} ate={dataFim} />
        <p className="text-xs text-ink/50 mb-4">
          Tarefas contadas pelo prazo dentro do período; provas contadas por quando o aluno respondeu.
        </p>

        {linhas.length === 0 ? (
          <EstadoVazio texto="Nenhum aluno ativo cadastrado ainda." />
        ) : (
          <div className="border border-line rounded-xl bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-4 py-2.5 border-b border-line">
                      Aluno
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-4 py-2.5 border-b border-line">
                      Tarefas entregues
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-4 py-2.5 border-b border-line">
                      Nota média (tarefas)
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-4 py-2.5 border-b border-line">
                      Provas respondidas
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-4 py-2.5 border-b border-line">
                      Nota média (provas)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-medium">{l.nome}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {l.tarefasEntregues}/{l.tarefasAtribuidas}
                      </td>
                      <td className="px-4 py-3 tabular-nums">
                        {l.notaMediaTarefas == null ? "—" : `${l.notaMediaTarefas}%`}
                      </td>
                      <td className="px-4 py-3 tabular-nums">{l.provasRespondidas}</td>
                      <td className="px-4 py-3 tabular-nums">
                        {l.notaMediaProvas == null ? "—" : `${l.notaMediaProvas}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
