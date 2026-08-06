"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { publicarAviso, type ResultadoAviso } from "./actions";

type Aluno = { id: string; nome: string };

export default function NovoAvisoForm({ alunos }: { alunos: Aluno[] }) {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAviso | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await publicarAviso(formData);
    setEnviando(false);
    if (res.ok) {
      router.push("/professor/avisos");
      return;
    }
    setResultado(res);
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-line rounded-xl p-6"
    >
      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="titulo">
          Título <span className="text-bad">*</span>
        </label>
        <input
          id="titulo"
          name="titulo"
          required
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="conteudo">
          Conteúdo <span className="text-bad">*</span>
        </label>
        <textarea
          id="conteudo"
          name="conteudo"
          rows={3}
          required
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="sm:col-span-2">
        <label className="block text-sm mb-1" htmlFor="aluno_id">
          Destinatário
        </label>
        <select
          id="aluno_id"
          name="aluno_id"
          defaultValue=""
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Geral (todos os alunos ativos com login)</option>
          {alunos.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nome}
            </option>
          ))}
        </select>
      </div>

      {resultado && !resultado.ok && (
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
          {enviando ? "Publicando..." : "Publicar aviso"}
        </button>
      </div>
    </form>
  );
}
