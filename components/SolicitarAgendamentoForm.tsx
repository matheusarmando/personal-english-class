"use client";

import { useState } from "react";
import { solicitarAgendamento, type ResultadoSolicitacao } from "@/app/aluno/actions";

export default function SolicitarAgendamentoForm({ aulaHorarioId }: { aulaHorarioId: string }) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<"remarcacao" | "cancelamento">("remarcacao");
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoSolicitacao | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await solicitarAgendamento(formData);
    setResultado(res);
    setEnviando(false);
  }

  if (resultado?.ok) {
    return (
      <p className="mt-4 border-t border-line pt-3 text-xs text-good">
        Solicitação enviada. Você será avisado quando o professor responder.
      </p>
    );
  }

  if (!aberto) {
    return (
      <button
        type="button"
        onClick={() => setAberto(true)}
        className="mt-4 w-full border-t border-line pt-3 text-left text-xs font-semibold text-accent hover:underline"
      >
        Solicitar remarcação ou cancelamento
      </button>
    );
  }

  return (
    <form action={handleSubmit} className="mt-4 space-y-2 border-t border-line pt-3">
      <input type="hidden" name="aula_horario_id" value={aulaHorarioId} />

      <div className="flex gap-3 text-xs">
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="tipo"
            value="remarcacao"
            checked={tipo === "remarcacao"}
            onChange={() => setTipo("remarcacao")}
          />
          Remarcação
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="radio"
            name="tipo"
            value="cancelamento"
            checked={tipo === "cancelamento"}
            onChange={() => setTipo("cancelamento")}
          />
          Cancelamento
        </label>
      </div>

      {tipo === "remarcacao" && (
        <div className="flex gap-2">
          <input
            name="data"
            type="date"
            required
            className="flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <input
            name="hora"
            type="time"
            required
            className="flex-1 rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      )}

      <textarea
        name="motivo"
        rows={2}
        placeholder="Motivo (opcional)"
        className="w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent"
      />

      {resultado && !resultado.ok && (
        <p className="text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-accent text-white px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar solicitação"}
        </button>
        <button
          type="button"
          onClick={() => setAberto(false)}
          className="text-xs text-ink/50 hover:text-ink"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
