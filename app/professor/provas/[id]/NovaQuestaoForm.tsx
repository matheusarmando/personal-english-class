"use client";

import { useRef, useState } from "react";
import { adicionarQuestao, type ResultadoQuestao } from "../actions";

export default function NovaQuestaoForm({ provaId, proximaOrdem }: { provaId: string; proximaOrdem: number }) {
  const [numAlternativas, setNumAlternativas] = useState(4);
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<ResultadoQuestao | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await adicionarQuestao(provaId, formData);
    setResultado(res);
    setEnviando(false);
    if (res.ok) {
      formRef.current?.reset();
      setNumAlternativas(4);
    }
  }

  return (
    <form
      ref={formRef}
      action={handleSubmit}
      className="space-y-3 bg-white border border-line rounded-xl p-6"
    >
      <input type="hidden" name="ordem" value={proximaOrdem} />

      <div>
        <label className="block text-sm mb-1" htmlFor="enunciado">
          Enunciado <span className="text-bad">*</span>
        </label>
        <textarea
          id="enunciado"
          name="enunciado"
          rows={2}
          required
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="w-28">
        <label className="block text-sm mb-1" htmlFor="pontos">
          Pontos
        </label>
        <input
          id="pontos"
          name="pontos"
          type="number"
          min="1"
          defaultValue={1}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="space-y-2">
        <p className="text-sm">
          Alternativas <span className="text-bad">*</span> — marque a correta
        </p>
        {Array.from({ length: numAlternativas }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <input type="radio" name="correta_index" value={i} required className="shrink-0" />
            <input
              name="alternativa_texto"
              placeholder={`Alternativa ${i + 1}`}
              required
              className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
          </div>
        ))}
        <button
          type="button"
          onClick={() => setNumAlternativas((n) => n + 1)}
          className="text-xs font-semibold text-accent hover:underline"
        >
          + Adicionar alternativa
        </button>
      </div>

      {resultado && !resultado.ok && (
        <p className="text-xs text-bad" role="alert">
          {resultado.erro}
        </p>
      )}
      {resultado?.ok && (
        <p className="text-xs text-good" role="status">
          Questão adicionada.
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50"
      >
        {enviando ? "Adicionando..." : "Adicionar questão"}
      </button>
    </form>
  );
}
