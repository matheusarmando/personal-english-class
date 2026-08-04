"use client";

import { useState } from "react";
import { enviarComprovante } from "./actions";

export default function EnviarComprovanteForm({ parcelaId }: { parcelaId: string }) {
  const [aberto, setAberto] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; erro: string | null } | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await enviarComprovante(parcelaId, formData);
    setResultado(res);
    setEnviando(false);
    if (res.ok) setAberto(false);
  }

  if (resultado?.ok) {
    return <p className="text-xs text-good">Comprovante enviado — aguardando aprovação do professor.</p>;
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="text-xs font-semibold text-accent hover:underline"
      >
        Enviar comprovante
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="flex flex-wrap items-center gap-2">
      <input
        type="file"
        name="arquivo"
        accept="image/jpeg,image/png,application/pdf"
        required
        className="text-xs"
      />
      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-accent text-white px-3 py-1 text-xs font-semibold disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar"}
      </button>
      {resultado && !resultado.ok && (
        <p className="text-xs text-bad w-full" role="alert">
          {resultado.erro}
        </p>
      )}
    </form>
  );
}
