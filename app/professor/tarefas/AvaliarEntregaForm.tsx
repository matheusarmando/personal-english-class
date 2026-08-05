"use client";

import { useState } from "react";
import { avaliarEntrega, type ResultadoTarefa } from "./actions";

export default function AvaliarEntregaForm({
  entregaId,
  notaAtual,
  feedbackAtual,
}: {
  entregaId: string;
  notaAtual: number | null;
  feedbackAtual: string | null;
}) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoTarefa | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await avaliarEntrega(entregaId, formData);
    setResultado(res);
    setEnviando(false);
  }

  return (
    <form action={handleSubmit} className="mt-2 flex flex-wrap items-start gap-2">
      <input
        name="nota"
        type="number"
        min="0"
        placeholder="Nota"
        defaultValue={notaAtual ?? ""}
        className="w-20 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs"
      />
      <input
        name="feedback"
        placeholder="Feedback (opcional)"
        defaultValue={feedbackAtual ?? ""}
        className="flex-1 min-w-[10rem] rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs"
      />
      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-good/15 text-good px-3 py-1.5 text-xs font-semibold hover:bg-good hover:text-white transition-colors disabled:opacity-50"
      >
        {enviando ? "Salvando..." : notaAtual !== null ? "Atualizar avaliação" : "Avaliar"}
      </button>
      {resultado && !resultado.ok && (
        <p className="w-full text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}
    </form>
  );
}
