import { createClient, getProfile } from "@/lib/supabase/server";

export default async function AlunoPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: presencas } = await supabase
    .from("presencas")
    .select("presente, aulas(titulo, data, turmas(nome))")
    .eq("aluno_id", profile?.id)
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-paper text-ink px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <h1 className="font-display text-3xl mb-8">Olá, {profile?.nome}</h1>

      <section className="max-w-xl">
        <h2 className="font-display text-lg mb-3">Minha frequência</h2>
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
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    p.presente
                      ? "bg-accentSoft text-accent"
                      : "bg-red-50 text-red-600"
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
