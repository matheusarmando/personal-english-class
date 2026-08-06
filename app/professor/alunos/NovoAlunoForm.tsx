"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { criarAluno, type ResultadoAluno } from "./actions";
import CampoTelefone from "@/components/campos/CampoTelefone";
import CampoEmail from "@/components/campos/CampoEmail";

export default function NovoAlunoForm() {
  const router = useRouter();
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoAluno | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await criarAluno(formData);
    setEnviando(false);
    if (res.ok) {
      router.push("/professor/alunos");
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
          Nome <span className="text-bad">*</span>
        </label>
        <input
          id="nome"
          name="nome"
          required
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
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
        <label className="block text-sm mb-1" htmlFor="data_nascimento">
          Data de nascimento
        </label>
        <input
          id="data_nascimento"
          name="data_nascimento"
          type="date"
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
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <p className="sm:col-span-2 text-xs text-ink/50">
        Cobrança e forma de pagamento agora ficam em{" "}
        <span className="font-medium">Financeiro → Novo contrato</span>, depois de cadastrar o aluno.
      </p>

      <div className="sm:col-span-2 flex items-center gap-2">
        <input id="ativo" name="ativo" type="checkbox" defaultChecked className="rounded border-line" />
        <label className="text-sm" htmlFor="ativo">
          Aluno ativo
        </label>
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
          {enviando ? "Cadastrando..." : "Cadastrar aluno"}
        </button>
      </div>
    </form>
  );
}
