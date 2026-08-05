"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { responderProva } from "../actions";

type Alternativa = { id: string; texto: string };
type Questao = { id: string; enunciado: string; pontos: number; alternativas: Alternativa[] };

export default function ResponderProvaForm({ provaId, questoes }: { provaId: string; questoes: Questao[] }) {
  const router = useRouter();
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const todasRespondidas = questoes.every((q) => respostas[q.id]);

  async function enviar() {
    setEnviando(true);
    setErro(null);
    const payload = questoes.map((q) => ({ questao_id: q.id, alternativa_id: respostas[q.id] }));
    const res = await responderProva(provaId, payload);
    if (!res.ok) {
      setErro(res.erro);
      setEnviando(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="max-w-2xl space-y-6">
      {questoes.map((q, i) => (
        <div key={q.id} className="border border-line rounded-xl bg-white p-4">
          <p className="text-sm font-medium mb-2">
            {i + 1}. {q.enunciado}{" "}
            <span className="text-xs text-ink/50 font-normal">· {q.pontos} pts</span>
          </p>
          <div className="space-y-1">
            {q.alternativas.map((alt) => (
              <label
                key={alt.id}
                className="flex items-center gap-2 text-sm px-2 py-1 rounded hover:bg-paper cursor-pointer"
              >
                <input
                  type="radio"
                  name={`questao-${q.id}`}
                  checked={respostas[q.id] === alt.id}
                  onChange={() => setRespostas((prev) => ({ ...prev, [q.id]: alt.id }))}
                />
                {alt.texto}
              </label>
            ))}
          </div>
        </div>
      ))}

      {erro && (
        <p className="text-xs text-bad" role="alert">
          {erro}
        </p>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={!todasRespondidas || enviando}
        className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
      >
        {enviando ? "Enviando..." : "Enviar respostas"}
      </button>
    </div>
  );
}
