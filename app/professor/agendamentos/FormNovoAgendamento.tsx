"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { LABEL_TIPO_AGENDAMENTO } from "@/lib/calendario";
import { criarAgendamentoAvulso, type ResultadoAgendamento } from "./actions";
import CampoTelefone from "@/components/campos/CampoTelefone";
import CampoEmail from "@/components/campos/CampoEmail";

function formatarHora(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export default function FormNovoAgendamento() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAgendamento | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await criarAgendamentoAvulso(formData);
    setEnviando(false);
    if (res.ok) {
      router.push("/professor/agendamentos");
      return;
    }
    setResultado(res);
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/70 border border-line rounded-xl p-6"
    >
      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="nome">
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="tipo">
          Tipo
        </label>
        <select
          id="tipo"
          name="tipo"
          defaultValue="teste_proficiencia"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          {Object.entries(LABEL_TIPO_AGENDAMENTO).map(([valor, label]) => (
            <option key={valor} value={valor}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="email">
          E-mail
        </label>
        <CampoEmail id="email" name="email" />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="telefone">
          Telefone
        </label>
        <CampoTelefone id="telefone" name="telefone" />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="data">
          Data
        </label>
        <input
          id="data"
          name="data"
          type="date"
          required
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="hora">
          Hora
        </label>
        <input
          id="hora"
          name="hora"
          type="time"
          required
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="observacoes">
          Observações
        </label>
        <textarea
          id="observacoes"
          name="observacoes"
          rows={2}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {resultado && !resultado.ok && resultado.conflito && (
        <div className="sm:col-span-2 text-xs text-bad bg-bad/10 border border-bad/30 rounded-lg p-3">
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
        <p className="sm:col-span-2 text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
        >
          {enviando ? "Agendando..." : "Agendar"}
        </button>
      </div>
    </form>
  );
}
