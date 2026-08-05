"use client";

import { useState } from "react";
import { atualizarAluno, type ResultadoAluno } from "../actions";
import CampoTelefone from "@/components/campos/CampoTelefone";

type Aluno = {
  id: string;
  nome: string;
  email: string | null;
  telefone: string | null;
  data_nascimento: string | null;
  link_aula: string | null;
  ativo: boolean;
};

export default function EditarAlunoForm({ aluno }: { aluno: Aluno }) {
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAluno | null>(null);

  async function handleSubmit(formData: FormData) {
    setSalvando(true);
    const res = await atualizarAluno(aluno.id, formData);
    setResultado(res);
    setSalvando(false);
  }

  return (
    <form
      action={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white/70 border border-line rounded-xl p-6"
    >
      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="nome">
          Nome <span className="text-bad">*</span>
        </label>
        <input
          id="nome"
          name="nome"
          required
          defaultValue={aluno.nome}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={aluno.email ?? ""}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="telefone">
          Telefone
        </label>
        <CampoTelefone id="telefone" name="telefone" defaultValue={aluno.telefone} />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="data_nascimento">
          Data de nascimento
        </label>
        <input
          id="data_nascimento"
          name="data_nascimento"
          type="date"
          defaultValue={aluno.data_nascimento ?? ""}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="link_aula">
          Link da aula
        </label>
        <input
          id="link_aula"
          name="link_aula"
          type="url"
          placeholder="https://meet.google.com/..."
          defaultValue={aluno.link_aula ?? ""}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="sm:col-span-2 flex items-center gap-2">
        <input
          id="ativo"
          name="ativo"
          type="checkbox"
          defaultChecked={aluno.ativo}
          className="rounded border-line"
        />
        <label className="text-sm" htmlFor="ativo">
          Aluno ativo
        </label>
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

      <div className="sm:col-span-2 flex items-center justify-between">
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
