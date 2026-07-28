"use client";

import { useState } from "react";

type Aluno = { id: string; nome: string };
type Mensagem = { id: string; remetente: "professor" | "aluno"; texto: string; hora: string };

const horaAtual = () =>
  new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

function seedMensagens(nome: string): Mensagem[] {
  return [
    {
      id: "seed-1",
      remetente: "aluno",
      texto: `Oi, professor! Posso remarcar a aula de quinta?`,
      hora: "09:14",
    },
    {
      id: "seed-2",
      remetente: "professor",
      texto: `Claro, ${nome}! Que horário funciona melhor pra você?`,
      hora: "09:20",
    },
  ];
}

export default function ChatMock({ alunos }: { alunos: Aluno[] }) {
  const [selecionadoId, setSelecionadoId] = useState(alunos[0]?.id ?? "");
  const [conversas, setConversas] = useState<Record<string, Mensagem[]>>(() =>
    Object.fromEntries(alunos.map((a) => [a.id, seedMensagens(a.nome)]))
  );
  const [texto, setTexto] = useState("");

  const alunoSelecionado = alunos.find((a) => a.id === selecionadoId);
  const mensagens = conversas[selecionadoId] ?? [];

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (!texto.trim() || !selecionadoId) return;
    const nova: Mensagem = {
      id: crypto.randomUUID(),
      remetente: "professor",
      texto: texto.trim(),
      hora: horaAtual(),
    };
    setConversas((prev) => ({
      ...prev,
      [selecionadoId]: [...(prev[selecionadoId] ?? []), nova],
    }));
    setTexto("");
  }

  if (alunos.length === 0) {
    return (
      <p className="text-sm text-ink/60 max-w-xl">
        Cadastre pelo menos um aluno ativo em{" "}
        <span className="font-medium">Alunos</span> pra ter conversas aqui.
      </p>
    );
  }

  return (
    <div className="max-w-3xl border border-line rounded-xl bg-white overflow-hidden grid grid-cols-[13rem_1fr] h-[32rem]">
      <aside className="border-r border-line overflow-y-auto">
        {alunos.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setSelecionadoId(a.id)}
            className={`w-full text-left px-4 py-3 text-sm border-b border-line transition-colors ${
              a.id === selecionadoId ? "bg-accentSoft/50 font-medium" : "hover:bg-paper"
            }`}
          >
            {a.nome}
          </button>
        ))}
      </aside>

      <div className="flex flex-col">
        <div className="px-4 py-3 border-b border-line">
          <p className="text-sm font-semibold">{alunoSelecionado?.nome}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-paper/40">
          {mensagens.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.remetente === "professor" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                  m.remetente === "professor"
                    ? "bg-accent text-white rounded-br-sm"
                    : "bg-white border border-line rounded-bl-sm"
                }`}
              >
                <p>{m.texto}</p>
                <p
                  className={`text-[10px] mt-1 ${
                    m.remetente === "professor" ? "text-white/70" : "text-ink/40"
                  }`}
                >
                  {m.hora}
                </p>
              </div>
            </div>
          ))}
        </div>

        <form onSubmit={enviar} className="flex gap-2 p-3 border-t border-line">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="Escreva uma mensagem..."
            className="flex-1 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <button
            type="submit"
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
