"use client";

import { useState } from "react";
import { publicarProva, type ResultadoProva } from "../actions";

export default function PublicarProvaButton({ provaId }: { provaId: string }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoProva | null>(null);

  async function handleClick() {
    setEnviando(true);
    const res = await publicarProva(provaId);
    setResultado(res);
    setEnviando(false);
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={enviando}
        className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
      >
        {enviando ? "Publicando..." : "Publicar prova"}
      </button>
      {resultado && !resultado.ok && (
        <p className="text-xs text-bad mt-1" role="alert">
          {resultado.erro}
        </p>
      )}
    </div>
  );
}
