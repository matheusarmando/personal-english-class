"use client";

import { useRef, useState } from "react";
import { enviarEntrega, type ResultadoEntrega } from "./actions";

export default function EnviarEntregaForm({ tarefaId }: { tarefaId: string }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoEntrega | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await enviarEntrega(tarefaId, formData);
    setResultado(res);
    setEnviando(false);
    if (res.ok) formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="mt-2 space-y-2">
      <textarea
        name="texto_resposta"
        rows={3}
        required
        placeholder="Escreva sua resposta..."
        className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
      />
      {resultado && !resultado.ok && (
        <p className="text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}
      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar resposta"}
      </button>
    </form>
  );
}
