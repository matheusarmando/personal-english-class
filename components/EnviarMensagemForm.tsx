"use client";

import { useRef, useState } from "react";
import { enviarMensagem, type ResultadoMensagem } from "@/app/actions";

export default function EnviarMensagemForm({ conversaId }: { conversaId: string }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoMensagem | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await enviarMensagem(conversaId, formData);
    setResultado(res);
    setEnviando(false);
    if (res.ok) formRef.current?.reset();
  }

  return (
    <form ref={formRef} action={handleSubmit} className="border-t border-line p-3">
      <div className="flex gap-2">
        <input
          name="texto"
          placeholder="Escreva uma mensagem..."
          required
          autoComplete="off"
          className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar"}
        </button>
      </div>
      {resultado && !resultado.ok && (
        <p className="text-xs text-bad mt-1" role="alert">
          {resultado.erro}
        </p>
      )}
    </form>
  );
}
