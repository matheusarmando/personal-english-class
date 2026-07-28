import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import { criarAluno } from "./actions";

export default async function AlunosPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome, email, telefone, ativo, status_pagamento")
    .eq("professor_id", profile?.id)
    .order("nome");

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Cadastro de alunos</h1>

      <div className="max-w-2xl space-y-10">
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Novo aluno</h2>
          <form
            action={criarAluno}
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
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
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
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm mb-1" htmlFor="link_aula">
                Link da aula
              </label>
              <input
                id="link_aula"
                name="link_aula"
                type="url"
                placeholder="https://meet.google.com/..."
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="valor">
                Valor a pagar (R$)
              </label>
              <input
                id="valor"
                name="valor"
                type="number"
                step="0.01"
                min="0"
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="status_pagamento">
                Status de pagamento
              </label>
              <select
                id="status_pagamento"
                name="status_pagamento"
                defaultValue="pendente"
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="dia_vencimento">
                Dia do vencimento
              </label>
              <input
                id="dia_vencimento"
                name="dia_vencimento"
                type="number"
                min="1"
                max="31"
                placeholder="Ex.: 10"
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm mb-1" htmlFor="pix_copia_cola">
                PIX copia e cola
              </label>
              <textarea
                id="pix_copia_cola"
                name="pix_copia_cola"
                rows={2}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                id="ativo"
                name="ativo"
                type="checkbox"
                defaultChecked
                className="rounded border-line"
              />
              <label className="text-sm" htmlFor="ativo">
                Aluno ativo
              </label>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
              >
                Cadastrar aluno
              </button>
            </div>
          </form>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Meus alunos</h2>
          {!alunos || alunos.length === 0 ? (
            <p className="text-sm text-ink/60">
              Nenhum aluno cadastrado ainda.
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
                          aluno.status_pagamento === "pago"
                            ? "bg-good/15 text-good"
                            : aluno.status_pagamento === "atrasado"
                            ? "bg-bad/15 text-bad"
                            : "bg-warn/15 text-warn"
                        }`}
                      >
                        {aluno.status_pagamento}
                      </span>
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
        </section>
      </div>
    </main>
  );
}
