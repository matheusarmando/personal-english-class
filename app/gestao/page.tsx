import { createClient, getProfile } from "@/lib/supabase/server";

export default async function GestaoPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome, profiles(nome)");

  const { data: matriculas } = await supabase
    .from("matriculas")
    .select("turma_id");

  const contagemPorTurma = new Map<string, number>();
  for (const m of matriculas ?? []) {
    contagemPorTurma.set(m.turma_id, (contagemPorTurma.get(m.turma_id) ?? 0) + 1);
  }

  const { count: totalAlunos } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "aluno");

  const { count: totalProfessores } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "professor");

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Olá, {profile?.nome}</h1>
        <span className="text-sm text-ink/50">Área de gestão</span>
      </div>

      <section className="grid grid-cols-3 gap-4 max-w-2xl mb-8">
        <div className="border border-line rounded-xl p-4 bg-white">
          <p className="text-[11px] uppercase tracking-wide text-ink/50">
            Turmas
          </p>
          <p className="font-display font-bold text-3xl mt-1 tabular-nums">
            {turmas?.length ?? 0}
          </p>
        </div>
        <div className="border border-line rounded-xl p-4 bg-white">
          <p className="text-[11px] uppercase tracking-wide text-ink/50">
            Professores
          </p>
          <p className="font-display font-bold text-3xl mt-1 tabular-nums">
            {totalProfessores ?? 0}
          </p>
        </div>
        <div className="border border-line rounded-xl p-4 bg-white">
          <p className="text-[11px] uppercase tracking-wide text-ink/50">
            Alunos
          </p>
          <p className="font-display font-bold text-3xl mt-1 tabular-nums">
            {totalAlunos ?? 0}
          </p>
        </div>
      </section>

      <section className="max-w-2xl">
        <div className="border border-line rounded-xl bg-white overflow-hidden">
          <div className="px-5 py-3.5 border-b border-line">
            <h2 className="font-display font-bold text-lg">Turmas</h2>
          </div>
          {!turmas || turmas.length === 0 ? (
            <p className="text-sm text-ink/60 px-5 py-4">
              Nenhuma turma cadastrada.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-5 py-2.5 border-b border-line">
                      Turma
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-5 py-2.5 border-b border-line">
                      Professor
                    </th>
                    <th className="text-left text-[11px] uppercase tracking-wide text-ink/50 font-semibold px-5 py-2.5 border-b border-line">
                      Alunos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {turmas.map((t: any) => (
                    <tr key={t.id} className="border-b border-line last:border-0">
                      <td className="px-5 py-3 font-medium">{t.nome}</td>
                      <td className="px-5 py-3 text-ink/60">
                        {t.profiles?.nome ?? "Sem professor"}
                      </td>
                      <td className="px-5 py-3 tabular-nums">
                        {contagemPorTurma.get(t.id) ?? 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
