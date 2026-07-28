import { getProfile } from "@/lib/supabase/server";
import { atualizarMeuCadastro } from "./actions";

export default async function CadastroProfessorPage() {
  const profile = await getProfile();

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display font-semibold text-2xl">Meu cadastro</h1>
        <span className="text-sm text-ink/50">Área do professor</span>
      </div>

      <div className="max-w-xl space-y-8">
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">
            Editar dados pessoais
          </h2>
          <form
            action={atualizarMeuCadastro}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-line rounded-xl p-6"
          >
            <div className="sm:col-span-2">
              <label className="block text-sm mb-1" htmlFor="nome">
                Nome
              </label>
              <input
                id="nome"
                name="nome"
                required
                defaultValue={profile?.nome}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="telefone">
                Telefone
              </label>
              <input
                id="telefone"
                name="telefone"
                type="tel"
                defaultValue={profile?.telefone ?? ""}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="data_nascimento">
                Data de nascimento
              </label>
              <input
                id="data_nascimento"
                name="data_nascimento"
                type="date"
                defaultValue={profile?.data_nascimento ?? ""}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
              >
                Salvar alterações
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">
            Outras informações (somente leitura)
          </h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-line rounded-xl p-6 text-sm">
            <div>
              <dt className="text-xs text-ink/50 mb-0.5">E-mail</dt>
              <dd>{profile?.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-ink/50 mb-0.5">Papel</dt>
              <dd>
                <span className="text-xs font-semibold px-2 py-1 rounded-full bg-good/15 text-good">
                  Professor
                </span>
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </main>
  );
}
