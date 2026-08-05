import { createClient, getProfile } from "@/lib/supabase/server";
import EstadoVazio from "@/components/EstadoVazio";

const DIAS_PADRAO = 14;

export default async function RelatorioRetencaoPage({
  searchParams,
}: {
  searchParams: { dias?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const dias = Number(searchParams.dias) > 0 ? Number(searchParams.dias) : DIAS_PADRAO;
  const hoje = new Date();
  const limite = new Date(hoje.getTime() - dias * 24 * 60 * 60 * 1000);

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome, data_nascimento")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  const listaAlunos = alunos ?? [];
  const alunoIds = listaAlunos.map((a) => a.id);

  const { data: horarios } = alunoIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("aluno_id, data_hora")
        .in("aluno_id", alunoIds)
        .order("data_hora", { ascending: false })
    : { data: [] };

  const ultimaAulaPorAluno = new Map<string, string>();
  for (const h of horarios ?? []) {
    if (!ultimaAulaPorAluno.has(h.aluno_id)) {
      ultimaAulaPorAluno.set(h.aluno_id, h.data_hora);
    }
  }

  const semAulaRecente = listaAlunos
    .map((a) => ({ ...a, ultimaAula: ultimaAulaPorAluno.get(a.id) ?? null }))
    .filter((a) => !a.ultimaAula || new Date(a.ultimaAula) < limite)
    .sort((a, b) => (a.ultimaAula ?? "").localeCompare(b.ultimaAula ?? ""));

  const mesAtual = hoje.getMonth() + 1;
  const aniversariantes = listaAlunos.filter((a) => {
    if (!a.data_nascimento) return false;
    const mes = Number(a.data_nascimento.slice(5, 7));
    return mes === mesAtual;
  });

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Relatório de retenção</h1>

      <div className="max-w-2xl space-y-10">
        <section>
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="font-display font-semibold text-lg">Sem aula recente</h2>
            <form method="get" className="flex items-center gap-2">
              <label className="text-xs text-ink/50" htmlFor="dias">
                Dias sem aula
              </label>
              <input
                id="dias"
                name="dias"
                type="number"
                min="1"
                defaultValue={dias}
                className="w-16 rounded-lg border border-line bg-white px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
              />
              <button
                type="submit"
                className="rounded-lg border border-line px-2.5 py-1 text-xs font-semibold hover:border-accent transition-colors"
              >
                Aplicar
              </button>
            </form>
          </div>

          {semAulaRecente.length === 0 ? (
            <EstadoVazio texto={`Nenhum aluno ativo sem aula há ${dias}+ dias.`} />
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
              {semAulaRecente.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{a.nome}</span>
                  <span className="text-ink/50">
                    {a.ultimaAula
                      ? `Última aula: ${new Date(a.ultimaAula).toLocaleDateString("pt-BR")}`
                      : "Nunca teve aula registrada"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Aniversariantes do mês</h2>
          {aniversariantes.length === 0 ? (
            <EstadoVazio texto="Nenhum aniversariante este mês." />
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
              {aniversariantes.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span className="font-medium">{a.nome}</span>
                  <span className="text-ink/50">
                    {new Date(a.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
