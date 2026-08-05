import { getProfile } from "@/lib/supabase/server";
import { atualizarMeuCadastro } from "./actions";
import FormMeuCadastro from "@/components/FormMeuCadastro";

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
          <FormMeuCadastro
            action={atualizarMeuCadastro}
            nome={profile?.nome ?? ""}
            telefone={profile?.telefone ?? ""}
            dataNascimento={profile?.data_nascimento ?? ""}
          />
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
