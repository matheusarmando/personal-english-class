"use client";

import { useState } from "react";

export default function ConfirmarAcao({
  action,
  rotulo,
  titulo,
  mensagem,
  className,
}: {
  /** Server action já com os ids fixados via .bind — chamada com um FormData vazio ao confirmar. */
  action: (formData: FormData) => Promise<unknown>;
  rotulo: string;
  titulo: string;
  mensagem: string;
  className?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const [executando, setExecutando] = useState(false);

  async function confirmar() {
    setExecutando(true);
    await action(new FormData());
    setExecutando(false);
    setAberto(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAberto(true)}
        className={
          className ??
          "rounded-lg border border-line px-3 py-1.5 text-xs font-semibold hover:border-accent transition-colors"
        }
      >
        {rotulo}
      </button>

      {aberto && (
        <div
          className="fixed inset-0 bg-ink/40 flex items-center justify-center px-4 z-50"
          onClick={() => !executando && setAberto(false)}
        >
          <div
            className="w-full max-w-sm bg-paper border border-line rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-display font-semibold text-lg mb-2">{titulo}</h3>
            <p className="text-sm text-ink/70 mb-6">{mensagem}</p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setAberto(false)}
                disabled={executando}
                className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-accent transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmar}
                disabled={executando}
                className="rounded-lg bg-bad text-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
              >
                {executando ? "Confirmando..." : rotulo}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
