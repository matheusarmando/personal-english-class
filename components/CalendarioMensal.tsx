"use client";

import { useState } from "react";
import Link from "next/link";
import { chaveDia, type AulaDoDia } from "@/lib/calendario";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

// Tudo aqui em UTC de propósito — ver o comentário de chaveDia em
// lib/calendario.ts. mesRef chega do servidor como meia-noite UTC do
// dia 1; ler com getFullYear/getMonth (hora local do navegador)
// deslocava o mês inteiro pra trás em fusos atrás de UTC (ex.: Brasília).
function construirSemanas(mesRef: Date) {
  const ano = mesRef.getUTCFullYear();
  const mes = mesRef.getUTCMonth();
  const primeiroDia = new Date(Date.UTC(ano, mes, 1));
  const ultimoDia = new Date(Date.UTC(ano, mes + 1, 0));

  const dias: (Date | null)[] = [];
  for (let i = 0; i < primeiroDia.getUTCDay(); i++) dias.push(null);
  for (let d = 1; d <= ultimoDia.getUTCDate(); d++) {
    dias.push(new Date(Date.UTC(ano, mes, d)));
  }
  while (dias.length % 7 !== 0) dias.push(null);

  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
  return semanas;
}

function mesHref(baseHref: string, mesRef: Date, offset: number) {
  const alvo = new Date(Date.UTC(mesRef.getUTCFullYear(), mesRef.getUTCMonth() + offset, 1));
  const valor = `${alvo.getUTCFullYear()}-${String(alvo.getUTCMonth() + 1).padStart(2, "0")}`;
  return `${baseHref}?mes=${valor}`;
}

type AulaSelecionada = AulaDoDia & { data: Date };
type EventoGoogleDoDia = { hora: string; titulo: string };

export default function CalendarioMensal({
  mesRef,
  aulasPorDia,
  baseHref,
  eventosGooglePorDia,
}: {
  mesRef: Date;
  aulasPorDia: Record<string, AulaDoDia[]>;
  baseHref: string;
  /** Compromissos externos (Google Calendar) — só passado pro professor, nunca pro aluno. */
  eventosGooglePorDia?: Record<string, EventoGoogleDoDia[]>;
}) {
  const [aulaSelecionada, setAulaSelecionada] = useState<AulaSelecionada | null>(
    null
  );

  const semanas = construirSemanas(mesRef);
  const hoje = chaveDia(new Date());
  const tituloMes = mesRef.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <div className="border border-line rounded-xl bg-white/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <Link
          href={mesHref(baseHref, mesRef, -1)}
          prefetch={false}
          className="text-sm text-ink/60 hover:text-accent transition-colors"
        >
          ← Anterior
        </Link>
        <span className="font-display font-semibold text-sm capitalize">{tituloMes}</span>
        <Link
          href={mesHref(baseHref, mesRef, 1)}
          prefetch={false}
          className="text-sm text-ink/60 hover:text-accent transition-colors"
        >
          Próximo →
        </Link>
      </div>

      <div className="grid grid-cols-7 text-center text-xs text-ink/50 border-b border-line">
        {DIAS_SEMANA.map((d) => (
          <div key={d} className="py-2">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {semanas.flatMap((semana, si) =>
          semana.map((dia, di) => {
            const chave = dia ? chaveDia(dia) : `vazio-${si}-${di}`;
            const aulas = dia ? aulasPorDia[chaveDia(dia)] ?? [] : [];
            const eventosGoogle = dia ? eventosGooglePorDia?.[chaveDia(dia)] ?? [] : [];
            const ehHoje = dia && chaveDia(dia) === hoje;

            return (
              <div
                key={chave}
                className={`min-h-[5.5rem] border-b border-r border-line last:border-r-0 p-1.5 align-top ${
                  dia ? "" : "bg-paper/40"
                }`}
              >
                {dia && (
                  <>
                    <span
                      className={`text-xs inline-flex items-center justify-center w-5 h-5 rounded-full ${
                        ehHoje ? "bg-ink text-paper" : "text-ink/60"
                      }`}
                    >
                      {dia.getUTCDate()}
                    </span>
                    <div className="mt-1 space-y-0.5">
                      {aulas.slice(0, 3).map((a) => (
                        <button
                          key={a.id}
                          type="button"
                          onClick={() => setAulaSelecionada({ ...a, data: dia })}
                          title={`${a.hora} · ${a.titulo}`}
                          className="w-full text-left text-[11px] leading-tight bg-accentSoft text-accent rounded px-1 py-0.5 truncate hover:bg-accent hover:text-paper transition-colors"
                        >
                          {a.hora} {a.titulo}
                        </button>
                      ))}
                      {aulas.length > 3 && (
                        <p className="text-[11px] text-ink/50">
                          +{aulas.length - 3} mais
                        </p>
                      )}
                      {eventosGoogle.slice(0, 2).map((e, i) => (
                        <div
                          key={`g-${i}`}
                          title={`${e.hora} · ${e.titulo} (Google Calendar)`}
                          className="w-full text-left text-[11px] leading-tight bg-ink/10 text-ink/50 rounded px-1 py-0.5 truncate"
                        >
                          {e.hora} {e.titulo}
                        </div>
                      ))}
                      {eventosGoogle.length > 2 && (
                        <p className="text-[11px] text-ink/40">+{eventosGoogle.length - 2} no Google</p>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })
        )}
      </div>

      {aulaSelecionada && (
        <div
          className="fixed inset-0 bg-ink/40 flex items-center justify-center px-4 z-50"
          onClick={() => setAulaSelecionada(null)}
        >
          <div
            className="w-full max-w-sm bg-paper border border-line rounded-xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="font-display font-semibold text-xl">{aulaSelecionada.titulo}</h3>
              <button
                type="button"
                onClick={() => setAulaSelecionada(null)}
                className="text-ink/50 hover:text-ink text-sm"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-xs text-ink/50 mb-0.5">Data</dt>
                <dd className="capitalize">
                  {aulaSelecionada.data.toLocaleDateString("pt-BR", {
                    weekday: "long",
                    day: "2-digit",
                    month: "long",
                    year: "numeric",
                    timeZone: "UTC",
                  })}
                </dd>
              </div>

              <div>
                <dt className="text-xs text-ink/50 mb-0.5">Horário</dt>
                <dd>{aulaSelecionada.hora}</dd>
              </div>

              {aulaSelecionada.linkAula && (
                <div>
                  <dt className="text-xs text-ink/50 mb-0.5">Link da aula</dt>
                  <dd className="truncate">
                    <a
                      href={aulaSelecionada.linkAula}
                      target="_blank"
                      rel="noreferrer"
                      className="text-accent hover:underline"
                    >
                      {aulaSelecionada.linkAula}
                    </a>
                  </dd>
                </div>
              )}

              {aulaSelecionada.contato && (
                <div>
                  <dt className="text-xs text-ink/50 mb-0.5">Contato</dt>
                  <dd>{aulaSelecionada.contato}</dd>
                </div>
              )}

              {aulaSelecionada.observacoes && (
                <div>
                  <dt className="text-xs text-ink/50 mb-0.5">Observações</dt>
                  <dd>{aulaSelecionada.observacoes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}
