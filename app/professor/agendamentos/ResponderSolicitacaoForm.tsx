"use client";

import { useRef, useState } from "react";
import { aprovarSolicitacao, recusarSolicitacao, type ResultadoAgendamento } from "./actions";

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function ResponderSolicitacaoForm({ solicitacaoId }: { solicitacaoId: string }) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAgendamento | null>(null);
  const [respondida, setRespondida] = useState(false);

  async function aprovar() {
    if (!formRef.current) return;
    setEnviando(true);
    const res = await aprovarSolicitacao(solicitacaoId, new FormData(formRef.current));
    setResultado(res);
    setEnviando(false);
    if (res.ok) setRespondida(true);
  }

  async function recusar() {
    if (!formRef.current) return;
    setEnviando(true);
    await recusarSolicitacao(solicitacaoId, new FormData(formRef.current));
    setEnviando(false);
    setRespondida(true);
  }

  if (respondida) {
    return (
      <p className="mt-3 text-xs text-good" role="status">
        Resposta enviada.
      </p>
    );
  }

  return (
    <form ref={formRef} className="mt-3 flex flex-col gap-2">
      <input
        name="resposta"
        placeholder="Resposta ao aluno (opcional)"
        className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs"
      />

      {resultado && !resultado.ok && resultado.conflito && (
        <div className="text-xs text-bad bg-bad/10 border border-bad/30 rounded-lg p-2">
          <p>
            Você tem {resultado.tituloConflito ? `"${resultado.tituloConflito}"` : "um compromisso"} das{" "}
            {formatarHora(resultado.inicioConflito)} às {formatarHora(resultado.fimConflito)} no Google Calendar.
          </p>
          <label className="flex items-center gap-1.5 mt-2 text-ink/80">
            <input type="checkbox" name="forcar_agendamento" className="rounded border-line" />
            Aprovar mesmo assim
          </label>
        </div>
      )}
      {resultado && !resultado.ok && !resultado.conflito && (
        <p className="text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={aprovar}
          disabled={enviando}
          className="rounded-lg bg-good/15 text-good px-3 py-1.5 text-xs font-semibold hover:bg-good hover:text-white transition-colors disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Aprovar"}
        </button>
        <button
          type="button"
          onClick={recusar}
          disabled={enviando}
          className="rounded-lg bg-bad/15 text-bad px-3 py-1.5 text-xs font-semibold hover:bg-bad hover:text-white transition-colors disabled:opacity-50"
        >
          Recusar
        </button>
      </div>
    </form>
  );
}
