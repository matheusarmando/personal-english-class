import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";

export default async function AlunosPage({
  searchParams,
}: {
  searchParams: { busca?: string; status?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  let query = supabase
    .from("alunos")
    .select("id, nome, email, telefone, ativo")
    .eq("professor_id", profile?.id);

  if (searchParams.busca) {
    query = query.ilike("nome", `%${searchParams.busca}%`);
  }
  if (searchParams.status === "ativo") {
    query = query.eq("ativo", true);
  } else if (searchParams.status === "inativo") {
    query = query.eq("ativo", false);
  }

  const { data: alunos } = await query.order("nome");

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
            Área do professor
          </p>
          <h1 className="font-display font-semibold text-3xl">Cadastro de alunos</h1>
        </div>
        <Link
          href="/professor/alunos/novo"
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
        >
          Novo aluno
        </Link>
      </div>

      <div className="max-w-2xl">
        <form
            method="get"
            className="flex flex-wrap gap-2 mb-3 bg-white border border-line rounded-xl p-3"
          >
            <input
              type="search"
              name="busca"
              placeholder="Buscar por nome..."
              defaultValue={searchParams.busca ?? ""}
              className="flex-1 min-w-[10rem] rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <select
              name="status"
              defaultValue={searchParams.status ?? ""}
              className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">Todos os status</option>
              <option value="ativo">Ativos</option>
              <option value="inativo">Inativos</option>
            </select>
            <button
              type="submit"
              className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent transition-colors"
            >
              Filtrar
            </button>
            {(searchParams.busca || searchParams.status) && (
              <Link
                href="/professor/alunos"
                className="rounded-lg px-3 py-1.5 text-sm text-ink/50 hover:text-ink transition-colors"
              >
                Limpar
              </Link>
            )}
          </form>

          {!alunos || alunos.length === 0 ? (
            <p className="text-sm text-ink/60">
              {searchParams.busca || searchParams.status
                ? "Nenhum aluno encontrado com esse filtro."
                : "Nenhum aluno cadastrado ainda."}
            </p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white/60">
              {alunos.map((aluno) => (
                <li key={aluno.id}>
                  <Link
                    href={`/professor/alunos/${aluno.id}`}
                    className="flex items-center justify-between px-4 py-3 hover:bg-accentSoft/40 transition-colors"
                  >
                    <div>
                      <p className="text-sm font-medium">{aluno.nome}</p>
                      <p className="text-xs text-ink/50">
                        {aluno.email ?? "sem e-mail"}
                        {aluno.telefone ? ` · ${aluno.telefone}` : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-semibold px-2 py-1 rounded-full ${
                          aluno.ativo
                            ? "bg-good/15 text-good"
                            : "bg-line/50 text-ink/50"
                        }`}
                      >
                        {aluno.ativo ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
      </div>
    </main>
  );
}
