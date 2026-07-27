"use client";

import { useTransition } from "react";
import { marcarPresenca } from "@/app/professor/actions";

type Aluno = {
  id: string;
  nome: string;
  presente: boolean | null;
};

export default function ListaChamada({
  aulaId,
  alunos,
}: {
  aulaId: string;
  alunos: Aluno[];
}) {
  const [isPending, startTransition] = useTransition();

  return (
    <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white/60">
      {alunos.map((aluno) => (
        <li
          key={aluno.id}
          className="flex items-center justify-between px-4 py-3"
        >
          <span className="text-sm">{aluno.nome}</span>
          <div className="flex gap-2">
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(() => marcarPresenca(aulaId, aluno.id, true))
              }
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                aluno.presente
                  ? "bg-good/15 text-good border-good"
                  : "border-line hover:border-good"
              }`}
            >
              Presente
            </button>
            <button
              disabled={isPending}
              onClick={() =>
                startTransition(() => marcarPresenca(aulaId, aluno.id, false))
              }
              className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                aluno.presente === false
                  ? "bg-bad/15 text-bad border-bad"
                  : "border-line hover:border-bad"
              }`}
            >
              Ausente
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
