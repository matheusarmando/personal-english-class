"use client";

import { useState } from "react";
import { solicitarAula } from "./actions";

export default function FormularioSolicitacao({ slug }: { slug: string }) {
  const [enviando, setEnviando] = useState(false);
  const [resultado, setResultado] = useState<{ ok: boolean; erro: string | null } | null>(null);

  async function handleSubmit(formData: FormData) {
    setEnviando(true);
    const res = await solicitarAula(slug, formData);
    setResultado(res);
    setEnviando(false);
  }

  if (resultado?.ok) {
    return (
      <div className="rounded-xl border border-good/30 bg-good/10 p-5 text-sm text-ink">
        <p className="font-semibold text-good mb-1">Pedido enviado!</p>
        <p>O professor vai entrar em contato com você em breve.</p>
      </div>
    );
  }

  return (
    <form action={handleSubmit} className="space-y-3">
      <div>
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
        <label className="block text-sm mb-1" htmlFor="email">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="telefone">
          WhatsApp
        </label>
        <input
          id="telefone"
          name="telefone"
          type="tel"
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm mb-1" htmlFor="mensagem">
          Mensagem (opcional)
        </label>
        <textarea
          id="mensagem"
          name="mensagem"
          rows={3}
          placeholder="Conte um pouco sobre o que você procura..."
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      {resultado && !resultado.ok && (
        <p className="text-sm text-bad" role="alert">
          {resultado.erro}
        </p>
      )}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-lg bg-accent text-white py-2.5 text-sm font-semibold hover:-translate-y-px transition-transform disabled:opacity-50 disabled:hover:translate-y-0"
      >
        {enviando ? "Enviando..." : "Quero uma aula"}
      </button>
    </form>
  );
}
