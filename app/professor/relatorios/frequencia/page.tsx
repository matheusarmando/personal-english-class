import { createClient, getProfile } from "@/lib/supabase/server";
import { periodoMesAtual } from "@/lib/periodo";
import FiltroPeriodo from "@/components/relatorios/FiltroPeriodo";
import EstadoVazio from "@/components/EstadoVazio";

export default async function RelatorioFrequenciaPage({
  searchParams,
}: {
  searchParams: { de?: string; ate?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const padrao = periodoMesAtual();
  const dataInicio = searchParams.de || padrao.de;
  const dataFim = searchParams.ate || padrao.ate;

  const inicio = new Date(`${dataInicio}T00:00:00.000Z`);
  const fim = new Date(`${dataFim}T23:59:59.999Z`);

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  const listaAlunos = alunos ?? [];
  const alunoIds = listaAlunos.map((a) => a.id);

  const { data: horarios } = alunoIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("aluno_id, status")
        .in("aluno_id", alunoIds)
        .gte("data_hora", inicio.toISOString())
        .lte("data_hora", fim.toISOString())
    : { data: [] };

  const linhas = listaAlunos.map((aluno) => {
    const doAluno = (horarios ?? []).filter((h) => h.aluno_id === aluno.id);
    const concluidas = doAluno.filter((h) => h.status === "concluida").length;
    const canceladas = doAluno.filter((h) => h.status === "cancelada").length;
    const total = doAluno.length;
    const taxa = total > 0 ? Math.round((concluidas / total) * 100) : null;
    return { ...aluno, total, concluidas, canceladas, taxa };
  });

  const totalGeral = linhas.reduce((acc, l) => acc + l.total, 0);
  const concluidasGeral = linhas.reduce((acc, l) => acc + l.concluidas, 0);

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Relatório de frequência</h1>

      <div className="max-w-3xl">
        <FiltroPeriodo de={dataInicio} ate={dataFim} />

        <div className="grid grid-cols-3 gap-3 mb-6 max-w-md">
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Aulas no período</p>
            <p className="font-display font-bold text-2xl mt-1 tabular-nums">{totalGeral}</p>
          </div>
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Concluídas</p>
            <p className="font-display font-bold text-2xl mt-1 tabular-nums text-good">{concluidasGeral}</p>
          </div>
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Frequência geral</p>
            <p className="font-display font-bold text-2xl mt-1 tabular-nums">
              {totalGeral > 0 ? `${Math.round((concluidasGeral / totalGeral) * 100)}%` : "—"}
            </p>
          </div>
        </div>

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
                      Aulas
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-4 py-2.5 border-b border-line">
                      Concluídas
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-4 py-2.5 border-b border-line">
                      Canceladas
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-4 py-2.5 border-b border-line">
                      Frequência
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.map((l) => (
                    <tr key={l.id} className="border-b border-line last:border-0">
                      <td className="px-4 py-3 font-medium">{l.nome}</td>
                      <td className="px-4 py-3 tabular-nums">{l.total}</td>
                      <td className="px-4 py-3 tabular-nums text-good">{l.concluidas}</td>
                      <td className="px-4 py-3 tabular-nums text-bad">{l.canceladas}</td>
                      <td className="px-4 py-3 tabular-nums">{l.taxa == null ? "—" : `${l.taxa}%`}</td>
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
