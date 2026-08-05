"use client";

import { useState } from "react";
import { criarProva, type ResultadoProva } from "./actions";

export default function NovaProvaForm() {
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    setErro(null);
    const res: ResultadoProva = await criarProva(formData);
    if (!res.ok) {
      setErro(res.erro);
      setEnviando(false);
    }
  }

  return (
    <form
      action={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-line rounded-xl p-6"
    >
      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="titulo">
          Título <span className="text-bad">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          placeholder="Ex.: Prova — Present Perfect"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="sm:col-span-2">
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
        <label className="block text-sm mb-1" htmlFor="data_aplicacao">
          Data de aplicação
        </label>
        <input
          id="data_aplicacao"
          name="data_aplicacao"
          type="date"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {erro && (
        <p className="sm:col-span-2 text-xs text-bad" role="alert">
          {erro}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
        >
          {enviando ? "Criando..." : "Criar prova"}
        </button>
      </div>
    </form>
  );
}
