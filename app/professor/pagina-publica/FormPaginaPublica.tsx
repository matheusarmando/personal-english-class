"use client";

import { useState } from "react";
import { atualizarPaginaPublica } from "./actions";

type Props = {
  slugAtual: string | null;
  bioAtual: string | null;
  precoAtual: number | null;
  ativaAtual: boolean;
  baseUrl: string;
};

export default function FormPaginaPublica({
  slugAtual,
  bioAtual,
  precoAtual,
  ativaAtual,
  baseUrl,
}: Props) {
  const [salvando, setSalvando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; erro: string | null } | null>(null);
  const [slug, setSlug] = useState(slugAtual ?? "");

  async function handleSubmit(formData: FormData) {
    setSalvando(true);
    const res = await atualizarPaginaPublica(formData);
    setResultado(res);
    setSalvando(false);
  }

  return (
    <form action={handleSubmit} className="bg-white border border-line rounded-xl p-6 space-y-4">
      <div>
        <label className="block text-sm mb-1" htmlFor="slug">
          Link da sua página
        </label>
        <div className="flex items-center rounded-lg border border-line bg-white overflow-hidden focus-within:ring-2 focus-within:ring-accent">
          <span className="px-3 py-2 text-sm text-ink/40 bg-paper border-r border-line whitespace-nowrap">
            {baseUrl}/p/
          </span>
          <input
            id="slug"
            name="slug"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            placeholder="joao-silva"
            className="flex-1 min-w-0 px-3 py-2 text-sm focus:outline-none"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="bio">
          Sobre você
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={3}
          defaultValue={bioAtual ?? ""}
          placeholder="Ex.: Professora de inglês há 8 anos, foco em conversação e preparação para provas de proficiência."
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="preco_aula">
          Preço da aula (R$)
        </label>
        <input
          id="preco_aula"
          name="preco_aula"
          type="number"
          step="0.01"
          min="0"
          defaultValue={precoAtual ?? ""}
          className="w-full max-w-[160px] rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          id="pagina_publica_ativa"
          name="pagina_publica_ativa"
          type="checkbox"
          defaultChecked={ativaAtual}
          className="rounded border-line"
        />
        <label className="text-sm" htmlFor="pagina_publica_ativa">
          Página pública ativa
        </label>
      </div>

      {resultado && (
        <p className={`text-sm ${resultado.ok ? "text-good" : "text-bad"}`} role="status">
          {resultado.ok ? "Salvo!" : resultado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={salvando}
        className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {salvando ? "Salvando..." : "Salvar"}
      </button>
    </form>
  );
}
