"use client";

import { useState } from "react";

type Aluno = { id: string; nome: string };
type StatusTarefa = "pendente" | "entregue" | "avaliada";

type Tarefa = {
  id: string;
  alunoId: string;
  alunoNome: string;
  titulo: string;
  descricao: string;
  prazo: string;
  pontos: number;
  permiteReenvio: boolean;
  status: StatusTarefa;
};

const LABEL_STATUS: Record<StatusTarefa, string> = {
  pendente: "Pendente",
  entregue: "Entregue",
  avaliada: "Avaliada",
};

const CLASSE_STATUS: Record<StatusTarefa, string> = {
  pendente: "bg-line/50 text-ink/60",
  entregue: "bg-warn/15 text-warn",
  avaliada: "bg-good/15 text-good",
};

function seed(alunos: Aluno[]): Tarefa[] {
  if (alunos.length === 0) return [];
  const nomeDe = (i: number) => alunos[i % alunos.length];
  return [
    {
      id: "seed-1",
      alunoId: nomeDe(0).id,
      alunoNome: nomeDe(0).nome,
      titulo: "Past Perfect — exercícios 32 a 34",
      descricao: "Completar os exercícios do livro sobre Past Perfect.",
      prazo: new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10),
      pontos: 10,
      permiteReenvio: true,
      status: "pendente",
    },
    {
      id: "seed-2",
      alunoId: nomeDe(1).id,
      alunoNome: nomeDe(1).nome,
      titulo: "Redação — My daily routine",
      descricao: "Escrever um texto de 150 palavras sobre a rotina diária.",
      prazo: new Date(Date.now() + 1 * 86400000).toISOString().slice(0, 10),
      pontos: 10,
      permiteReenvio: false,
      status: "entregue",
    },
    {
      id: "seed-3",
      alunoId: nomeDe(0).id,
      alunoNome: nomeDe(0).nome,
      titulo: "Vocabulário — Unidade 5",
      descricao: "Revisar e memorizar o vocabulário da unidade 5.",
      prazo: new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10),
      pontos: 5,
      permiteReenvio: true,
      status: "avaliada",
    },
  ];
}

export default function TarefasMock({ alunos }: { alunos: Aluno[] }) {
  const [tarefas, setTarefas] = useState<Tarefa[]>(() => seed(alunos));

  const pendentes = tarefas.filter((t) => t.status === "pendente").length;
  const entregues = tarefas.filter((t) => t.status === "entregue").length;
  const avaliadas = tarefas.filter((t) => t.status === "avaliada").length;

  function criarTarefa(formData: FormData) {
    const alunoId = formData.get("aluno_id") as string;
    const aluno = alunos.find((a) => a.id === alunoId);
    if (!aluno) return;

    const nova: Tarefa = {
      id: crypto.randomUUID(),
      alunoId: aluno.id,
      alunoNome: aluno.nome,
      titulo: (formData.get("titulo") as string) || "Sem título",
      descricao: (formData.get("descricao") as string) || "",
      prazo: (formData.get("prazo") as string) || "",
      pontos: Number(formData.get("pontos")) || 0,
      permiteReenvio: formData.get("permite_reenvio") === "on",
      status: "pendente",
    };
    setTarefas((prev) => [nova, ...prev]);
  }

  function avancarStatus(id: string) {
    setTarefas((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const proximo: Record<StatusTarefa, StatusTarefa> = {
          pendente: "entregue",
          entregue: "avaliada",
          avaliada: "avaliada",
        };
        return { ...t, status: proximo[t.status] };
      })
    );
  }

  if (alunos.length === 0) {
    return (
      <p className="text-sm text-ink/60 max-w-xl">
        Cadastre pelo menos um aluno ativo em{" "}
        <span className="font-medium">Alunos</span> pra poder atribuir
        tarefas.
      </p>
    );
  }

  return (
    <div className="max-w-3xl space-y-8">
      <section className="grid grid-cols-3 gap-3 max-w-md">
        <div className="border border-line rounded-xl p-3 bg-white">
          <p className="text-[11px] uppercase tracking-wide text-ink/50">Pendentes</p>
          <p className="font-display font-bold text-2xl mt-1 tabular-nums">{pendentes}</p>
        </div>
        <div className="border border-line rounded-xl p-3 bg-white">
          <p className="text-[11px] uppercase tracking-wide text-ink/50">Entregues</p>
          <p className="font-display font-bold text-2xl mt-1 tabular-nums text-warn">{entregues}</p>
        </div>
        <div className="border border-line rounded-xl p-3 bg-white">
          <p className="text-[11px] uppercase tracking-wide text-ink/50">Avaliadas</p>
          <p className="font-display font-bold text-2xl mt-1 tabular-nums text-good">{avaliadas}</p>
        </div>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg mb-3">Nova tarefa</h2>
        <form
          action={criarTarefa}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-line rounded-xl p-6"
        >
          <div className="sm:col-span-3">
            <label className="block text-sm mb-1" htmlFor="aluno_id">
              Aluno <span className="text-bad">*</span>
            </label>
            <select
              id="aluno_id"
              name="aluno_id"
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            >
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm mb-1" htmlFor="titulo">
              Título <span className="text-bad">*</span>
            </label>
            <input
              id="titulo"
              name="titulo"
              required
              placeholder="Ex.: Past Perfect — exercícios 32 a 34"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="sm:col-span-3">
            <label className="block text-sm mb-1" htmlFor="descricao">
              Instruções
            </label>
            <textarea
              id="descricao"
              name="descricao"
              rows={2}
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="prazo">
              Prazo <span className="text-bad">*</span>
            </label>
            <input
              id="prazo"
              name="prazo"
              type="date"
              required
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div>
            <label className="block text-sm mb-1" htmlFor="pontos">
              Pontos
            </label>
            <input
              id="pontos"
              name="pontos"
              type="number"
              min="0"
              placeholder="10"
              className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>

          <div className="flex items-end gap-2 pb-2.5">
            <input
              id="permite_reenvio"
              name="permite_reenvio"
              type="checkbox"
              className="rounded border-line"
            />
            <label className="text-sm" htmlFor="permite_reenvio">
              Permitir reenvio
            </label>
          </div>

          <div className="sm:col-span-3">
            <button
              type="submit"
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
            >
              Criar tarefa
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg mb-3">Todas as tarefas</h2>
        {tarefas.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhuma tarefa criada ainda.</p>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
            {tarefas.map((t) => (
              <li key={t.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{t.titulo}</p>
                  <p className="text-xs text-ink/50">
                    {t.alunoNome} · Prazo:{" "}
                    {new Date(t.prazo + "T00:00:00").toLocaleDateString("pt-BR")}
                    {t.pontos ? ` · ${t.pontos} pts` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${CLASSE_STATUS[t.status]}`}>
                    {LABEL_STATUS[t.status]}
                  </span>
                  {t.status !== "avaliada" && (
                    <button
                      type="button"
                      onClick={() => avancarStatus(t.id)}
                      className="text-xs font-semibold text-accent hover:underline"
                    >
                      {t.status === "pendente" ? "Marcar entregue" : "Avaliar"}
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
