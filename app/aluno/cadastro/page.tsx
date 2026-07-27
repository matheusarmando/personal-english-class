import { createClient, getProfile } from "@/lib/supabase/server";
import { atualizarMeuCadastro } from "./actions";

export default async function CadastroAlunoPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select(
      "id, nome, email, telefone, data_nascimento, link_aula, valor, status_pagamento, ativo, pix_copia_cola"
    )
    .eq("profile_id", profile?.id)
    .maybeSingle();

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <h1 className="font-display text-3xl mb-8">Meu cadastro</h1>

      {!aluno ? (
        <p className="text-sm text-ink/60 max-w-xl">
          Seu cadastro ainda não foi vinculado por um professor. Assim que
          isso acontecer, suas informações vão aparecer aqui.
        </p>
      ) : (
        <div className="max-w-xl space-y-8">
          <section>
            <h2 className="font-display text-lg mb-3">
              Editar dados pessoais
            </h2>
            <form
              action={atualizarMeuCadastro}
              className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/70 border border-line rounded-xl p-6"
            >
              <div className="sm:col-span-2">
                <label className="block text-sm mb-1" htmlFor="nome">
                  Nome
                </label>
                <input
                  id="nome"
                  name="nome"
                  required
                  defaultValue={aluno.nome}
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
                  defaultValue={aluno.telefone ?? ""}
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
                  defaultValue={aluno.data_nascimento ?? ""}
                  className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>

              <div className="sm:col-span-2">
                <button
                  type="submit"
                  className="rounded-full bg-ink text-paper px-4 py-2 text-sm font-medium hover:bg-accent transition-colors"
                >
                  Salvar alterações
                </button>
              </div>
            </form>
          </section>

          <section>
            <h2 className="font-display text-lg mb-3">
              Outras informações (somente leitura)
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/60 border border-line rounded-xl p-6 text-sm">
              <div>
                <dt className="text-xs text-ink/50 mb-0.5">E-mail</dt>
                <dd>{aluno.email ?? "—"}</dd>
              </div>

              <div>
                <dt className="text-xs text-ink/50 mb-0.5">Status</dt>
                <dd>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      aluno.ativo
                        ? "bg-accentSoft text-accent"
                        : "bg-line/40 text-ink/50"
                    }`}
                  >
                    {aluno.ativo ? "Ativo" : "Inativo"}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs text-ink/50 mb-0.5">
                  Status de pagamento
                </dt>
                <dd>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      aluno.status_pagamento === "pago"
                        ? "bg-accentSoft text-accent"
                        : aluno.status_pagamento === "atrasado"
                        ? "bg-red-50 text-red-600"
                        : "bg-line/40 text-ink/60"
                    }`}
                  >
                    {aluno.status_pagamento}
                  </span>
                </dd>
              </div>

              <div>
                <dt className="text-xs text-ink/50 mb-0.5">Valor da aula</dt>
                <dd>
                  {aluno.valor != null
                    ? aluno.valor.toLocaleString("pt-BR", {
                        style: "currency",
                        currency: "BRL",
                      })
                    : "—"}
                </dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs text-ink/50 mb-0.5">Link da aula</dt>
                <dd className="truncate">{aluno.link_aula ?? "—"}</dd>
              </div>

              <div className="sm:col-span-2">
                <dt className="text-xs text-ink/50 mb-0.5">
                  PIX copia e cola
                </dt>
                <dd className="break-all">{aluno.pix_copia_cola ?? "—"}</dd>
              </div>
            </dl>
          </section>
        </div>
      )}
    </main>
  );
}
