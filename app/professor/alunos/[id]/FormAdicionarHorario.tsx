"use client";

import { useState } from "react";
import { adicionarHorario, type ResultadoAgendamento } from "../actions";

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function FormAdicionarHorario({ alunoId }: { alunoId: string }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAgendamento | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await adicionarHorario(alunoId, formData);
    setResultado(res);
    setEnviando(false);
  }

  return (
    <form
      action={handleSubmit}
      className="flex gap-2 flex-wrap bg-white/70 border border-line rounded-xl p-4"
    >
      <input
        name="data"
        type="date"
        required
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
      />
      <input
        name="hora"
        type="time"
        required
        className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
      >
        {enviando ? "Adicionando..." : "Adicionar aula"}
      </button>

      {resultado && !resultado.ok && resultado.conflito && (
        <div className="w-full text-xs text-bad bg-bad/10 border border-bad/30 rounded-lg p-3">
          <p>
            Você tem {resultado.tituloConflito ? `"${resultado.tituloConflito}"` : "um compromisso"} das{" "}
            {formatarHora(resultado.inicioConflito)} às {formatarHora(resultado.fimConflito)} no Google Calendar.
          </p>
          <label className="flex items-center gap-1.5 mt-2 text-ink/80">
            <input type="checkbox" name="forcar_agendamento" className="rounded border-line" />
            Agendar mesmo assim
          </label>
        </div>
      )}

      {resultado && !resultado.ok && !resultado.conflito && (
        <p className="w-full text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}
    </form>
  );
}
