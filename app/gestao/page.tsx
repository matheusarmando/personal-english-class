import { createClient, getProfile } from "@/lib/supabase/server";

export default async function GestaoPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome, profiles(nome)");

  const { count: totalAlunos } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "aluno");

  const { count: totalProfessores } = await supabase
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("role", "professor");

  return (
    <main className="min-h-screen bg-paper text-ink px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área de gestão
      </p>
      <h1 className="font-display text-3xl mb-8">Olá, {profile?.nome}</h1>

      <section className="grid grid-cols-2 sm:grid-cols-3 gap-4 max-w-2xl mb-10">
        <div className="border border-line rounded-xl p-4 bg-white/60">
          <p className="text-2xl font-display">{turmas?.length ?? 0}</p>
          <p className="text-xs text-ink/60">Turmas</p>
        </div>
        <div className="border border-line rounded-xl p-4 bg-white/60">
          <p className="text-2xl font-display">{totalProfessores ?? 0}</p>
          <p className="text-xs text-ink/60">Professores</p>
        </div>
        <div className="border border-line rounded-xl p-4 bg-white/60">
          <p className="text-2xl font-display">{totalAlunos ?? 0}</p>
          <p className="text-xs text-ink/60">Alunos</p>
        </div>
      </section>

      <section className="max-w-xl">
        <h2 className="font-display text-lg mb-3">Turmas</h2>
        {!turmas || turmas.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhuma turma cadastrada.</p>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white/60">
            {turmas.map((t: any) => (
              <li key={t.id} className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium">{t.nome}</span>
                <span className="text-xs text-ink/50">
                  {t.profiles?.nome ?? "Sem professor"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
