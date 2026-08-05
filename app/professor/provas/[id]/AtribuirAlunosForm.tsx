"use client";

import { useState } from "react";
import { atribuirAlunos, type ResultadoProva } from "../actions";

type Aluno = { id: string; nome: string };

export default function AtribuirAlunosForm({
  provaId,
  alunosDisponiveis,
}: {
  provaId: string;
  alunosDisponiveis: Aluno[];
}) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProva | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await atribuirAlunos(provaId, formData);
    setResultado(res);
    setEnviando(false);
  }

  if (alunosDisponiveis.length === 0) {
    return <p className="text-xs text-ink/50">Todos os alunos ativos já estão atribuídos.</p>;
  }

  return (
    <form action={handleSubmit} className="space-y-2 bg-white border border-line rounded-xl p-4">
      {alunosDisponiveis.map((a) => (
        <label key={a.id} className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="aluno_id" value={a.id} className="rounded border-line" />
          {a.nome}
        </label>
      ))}

      {resultado && !resultado.ok && (
        <p className="text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}
      {resultado?.ok && (
        <p className="text-xs text-good" role="status">
          Alunos atribuídos.
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
      >
        {enviando ? "Salvando..." : "Atribuir selecionados"}
      </button>
    </form>
  );
}
