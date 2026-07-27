import { createClient, getProfile } from "@/lib/supabase/server";
import { criarAula } from "./actions";
import ListaChamada from "@/components/ListaChamada";

export default async function ProfessorPage() {
  const profile = await getProfile();
  const supabase = createClient();

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
    <main className="min-h-screen bg-paper text-ink px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display text-3xl mb-8">Olá, {profile?.nome}</h1>

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
