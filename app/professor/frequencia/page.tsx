import { createClient, getProfile } from "@/lib/supabase/server";

export default async function FrequenciaPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  const alunoIds = (alunos ?? []).map((a) => a.id);

  const { data: horarios } = alunoIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("aluno_id, status")
        .in("aluno_id", alunoIds)
    : { data: [] };

  const linhas = (alunos ?? []).map((aluno) => {
    const doAluno = (horarios ?? []).filter((h) => h.aluno_id === aluno.id);
    const concluidas = doAluno.filter((h) => h.status === "concluida").length;
    const canceladas = doAluno.filter((h) => h.status === "cancelada").length;
    const total = doAluno.length;
    const taxa = total > 0 ? Math.round((concluidas / total) * 100) : null;
    return { ...aluno, total, concluidas, canceladas, taxa };
  });

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Frequência</h1>

      <div className="max-w-3xl">
        {linhas.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum aluno ativo cadastrado ainda.</p>
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
                      <td className="px-4 py-3 tabular-nums">
                        {l.taxa == null ? "—" : `${l.taxa}%`}
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
