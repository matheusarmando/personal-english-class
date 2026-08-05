"use client";

import { useState } from "react";
import CampoTelefone from "@/components/campos/CampoTelefone";

type Resultado = { ok: true } | { ok: false; erro: string };

export default function FormMeuCadastro({
  action,
  nome,
  telefone,
  dataNascimento,
  className = "bg-white",
}: {
  action: (formData: FormData) => Promise<Resultado>;
  nome: string;
  telefone: string;
  dataNascimento: string;
  className?: string;
}) {
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<Resultado | null>(null);

  async function handleSubmit(formData: FormData) {
    setSalvando(true);
    setResultado(null);
    const res = await action(formData);
    setResultado(res);
    setSalvando(false);
  }

  return (
    <form
      action={handleSubmit}
      className={`grid grid-cols-1 sm:grid-cols-2 gap-3 border border-line rounded-xl p-6 ${className}`}
    >
      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="nome">
          Nome
        </label>
        <input
          id="nome"
          name="nome"
          required
          defaultValue={nome}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="telefone">
          Telefone
        </label>
        <CampoTelefone id="telefone" name="telefone" defaultValue={telefone} />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="data_nascimento">
          Data de nascimento
        </label>
        <input
          id="data_nascimento"
          name="data_nascimento"
          type="date"
          defaultValue={dataNascimento}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {resultado && !resultado.ok && (
        <p className="sm:col-span-2 text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}
      {resultado?.ok && (
        <p className="sm:col-span-2 text-xs text-good" role="status">
          Alterações salvas.
        </p>
      )}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={salvando}
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </form>
  );
}
