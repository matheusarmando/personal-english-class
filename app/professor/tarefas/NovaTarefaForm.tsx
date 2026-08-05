"use client";

import { useRef, useState } from "react";
import { criarTarefa, type ResultadoTarefa } from "./actions";

type Aluno = { id: string; nome: string };

export default function NovaTarefaForm({ alunos }: { alunos: Aluno[] }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoTarefa | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await criarTarefa(formData);
    setResultado(res);
    setEnviando(false);
    if (res.ok) formRef.current?.reset();
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white border border-line rounded-xl p-6"
    >
      <div className="sm:col-span-3">
        <label className="block text-sm mb-1" htmlFor="aluno_id">
          Aluno
        </label>
        <select
          id="aluno_id"
          name="aluno_id"
          defaultValue=""
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Geral (todos os alunos ativos)</option>
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

      {resultado && !resultado.ok && (
        <p className="sm:col-span-3 text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}
      {resultado?.ok && (
        <p className="sm:col-span-3 text-xs text-good" role="status">
          Tarefa criada.
        </p>
      )}

      <div className="sm:col-span-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
        >
          {enviando ? "Criando..." : "Criar tarefa"}
        </button>
      </div>
    </form>
  );
}
