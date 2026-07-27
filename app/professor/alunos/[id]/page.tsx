import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  atualizarAluno,
  excluirAluno,
  adicionarHorario,
  removerHorario,
} from "../actions";

export default async function AlunoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select(
      "id, nome, email, telefone, data_nascimento, link_aula, valor, status_pagamento, ativo, pix_copia_cola"
    )
    .eq("id", params.id)
    .single();

  if (!aluno) notFound();

  const { data: horarios } = await supabase
    .from("aluno_horarios")
    .select("id, data_hora")
    .eq("aluno_id", aluno.id)
    .order("data_hora");

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">{aluno.nome}</h1>

      <div className="max-w-2xl space-y-10">
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Dados do aluno</h2>
          <form
            action={atualizarAluno.bind(null, aluno.id)}
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
              <label className="block text-sm mb-1" htmlFor="email">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                defaultValue={aluno.email ?? ""}
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
              <label className="block text-sm mb-1" htmlFor="link_aula">
                Link da aula
              </label>
              <input
                id="link_aula"
                name="link_aula"
                type="url"
                placeholder="https://meet.google.com/..."
                defaultValue={aluno.link_aula ?? ""}
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
                defaultValue={aluno.valor ?? ""}
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
                defaultValue={aluno.status_pagamento}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <option value="pendente">Pendente</option>
                <option value="pago">Pago</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm mb-1" htmlFor="pix_copia_cola">
                PIX copia e cola
              </label>
              <textarea
                id="pix_copia_cola"
                name="pix_copia_cola"
                rows={2}
                defaultValue={aluno.pix_copia_cola ?? ""}
                className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <div className="sm:col-span-2 flex items-center gap-2">
              <input
                id="ativo"
                name="ativo"
                type="checkbox"
                defaultChecked={aluno.ativo}
                className="rounded border-line"
              />
              <label className="text-sm" htmlFor="ativo">
                Aluno ativo
              </label>
            </div>

            <div className="sm:col-span-2 flex items-center justify-between">
              <button
                type="submit"
                className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
              >
                Salvar alterações
              </button>
            </div>
          </form>

          <form action={excluirAluno.bind(null, aluno.id)} className="mt-3">
            <button
              type="submit"
              className="text-xs text-bad hover:underline"
            >
              Excluir aluno
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Aulas agendadas</h2>

          {!horarios || horarios.length === 0 ? (
            <p className="text-sm text-ink/60 mb-4">
              Nenhuma aula agendada para este aluno.
            </p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white/60 mb-4">
              {horarios.map((h) => {
                const dt = new Date(h.data_hora);
                return (
                  <li
                    key={h.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <span className="text-sm">
                      {dt.toLocaleDateString("pt-BR")} ·{" "}
                      {dt.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                    <form action={removerHorario.bind(null, aluno.id, h.id)}>
                      <button
                        type="submit"
                        className="text-xs text-bad hover:underline"
                      >
                        Remover
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            action={adicionarHorario.bind(null, aluno.id)}
            className="flex gap-2 flex-wrap bg-white/70 border border-line rounded-xl p-4"
          >
            <input
              name="data"
              type="date"
              required
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <input
              name="hora"
              type="time"
              required
              className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
            >
              Adicionar aula
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
