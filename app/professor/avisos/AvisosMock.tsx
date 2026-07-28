"use client";

import { useState } from "react";

type Aluno = { id: string; nome: string };
type Aviso = {
  id: string;
  titulo: string;
  conteudo: string;
  destinatario: string;
  data: string;
};

function seed(alunos: Aluno[]): Aviso[] {
  return [
    {
      id: "seed-1",
      titulo: "Feriado — sem aula na próxima segunda",
      conteudo: "Não haverá aula na segunda-feira por conta do feriado nacional.",
      destinatario: "Geral",
      data: new Date(Date.now() - 2 * 86400000).toLocaleDateString("pt-BR"),
    },
    ...(alunos[0]
      ? [
          {
            id: "seed-2",
            titulo: "Material de apoio enviado",
            conteudo: "Enviei o PDF do vocabulário da unidade 5 por e-mail.",
            destinatario: alunos[0].nome,
            data: new Date(Date.now() - 5 * 86400000).toLocaleDateString("pt-BR"),
          },
        ]
      : []),
  ];
}

export default function AvisosMock({ alunos }: { alunos: Aluno[] }) {
  const [avisos, setAvisos] = useState<Aviso[]>(() => seed(alunos));

  function criarAviso(formData: FormData) {
    const alunoId = formData.get("aluno_id") as string;
    const aluno = alunos.find((a) => a.id === alunoId);

    const novo: Aviso = {
      id: crypto.randomUUID(),
      titulo: (formData.get("titulo") as string) || "Sem título",
      conteudo: (formData.get("conteudo") as string) || "",
      destinatario: aluno ? aluno.nome : "Geral",
      data: new Date().toLocaleDateString("pt-BR"),
    };
    setAvisos((prev) => [novo, ...prev]);
  }

  return (
    <div className="max-w-2xl space-y-8">
      <section>
        <h2 className="font-display font-semibold text-lg mb-3">Novo aviso</h2>
        <form
          action={criarAviso}
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
              <option value="">Geral (todos os alunos)</option>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
            >
              Publicar aviso
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="font-display font-semibold text-lg mb-3">Avisos publicados</h2>
        {avisos.length === 0 ? (
          <p className="text-sm text-ink/60">Nenhum aviso publicado ainda.</p>
        ) : (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
            {avisos.map((a) => (
              <li key={a.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">{a.titulo}</p>
                  <span className="text-[11px] font-semibold px-2 py-1 rounded-full bg-accentSoft text-accent shrink-0">
                    {a.destinatario}
                  </span>
                </div>
                <p className="text-sm text-ink/60 mt-1">{a.conteudo}</p>
                <p className="text-xs text-ink/40 mt-1">{a.data}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
