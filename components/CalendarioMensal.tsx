"use client";

import { useState } from "react";
import Link from "next/link";
import { chaveDia, type AulaDoDia } from "@/lib/calendario";

const DIAS_SEMANA = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const LABEL_STATUS_PAGAMENTO: Record<string, string> = {
  pendente: "Pendente",
  pago: "Pago",
  atrasado: "Atrasado",
};

function construirSemanas(mesRef: Date) {
  const primeiroDia = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
  const ultimoDia = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 0);

  const dias: (Date | null)[] = [];
  for (let i = 0; i < primeiroDia.getDay(); i++) dias.push(null);
  for (let d = 1; d <= ultimoDia.getDate(); d++) {
    dias.push(new Date(mesRef.getFullYear(), mesRef.getMonth(), d));
  }
  while (dias.length % 7 !== 0) dias.push(null);

  const semanas: (Date | null)[][] = [];
  for (let i = 0; i < dias.length; i += 7) semanas.push(dias.slice(i, i + 7));
  return semanas;
}

function mesHref(baseHref: string, mesRef: Date, offset: number) {
  const alvo = new Date(mesRef.getFullYear(), mesRef.getMonth() + offset, 1);
  const valor = `${alvo.getFullYear()}-${String(alvo.getMonth() + 1).padStart(2, "0")}`;
  return `${baseHref}?mes=${valor}`;
}

type AulaSelecionada = AulaDoDia & { data: Date };

export default function CalendarioMensal({
  mesRef,
  aulasPorDia,
  baseHref,
}: {
  mesRef: Date;
  aulasPorDia: Record<string, AulaDoDia[]>;
  baseHref: string;
}) {
  const [aulaSelecionada, setAulaSelecionada] = useState<AulaSelecionada | null>(
    null
  );

  const semanas = construirSemanas(mesRef);
  const hoje = chaveDia(new Date());
  const tituloMes = mesRef.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });

  return (
    <div className="border border-line rounded-xl bg-white/60 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-line">
        <Link
          href={mesHref(baseHref, mesRef, -1)}
          className="text-sm text-ink/60 hover:text-accent transition-colors"
        >
          ← Anterior
        </Link>
        <span className="font-display font-semibold text-sm capitalize">{tituloMes}</span>
        <Link
          href={mesHref(baseHref, mesRef, 1)}
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
                      {dia.getDate()}
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

              {aulaSelecionada.valor != null && (
                <div>
                  <dt className="text-xs text-ink/50 mb-0.5">Valor</dt>
                  <dd>
                    {aulaSelecionada.valor.toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </dd>
                </div>
              )}

              {aulaSelecionada.statusPagamento && (
                <div>
                  <dt className="text-xs text-ink/50 mb-0.5">
                    Status de pagamento
                  </dt>
                  <dd>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        aulaSelecionada.statusPagamento === "pago"
                          ? "bg-good/15 text-good"
                          : aulaSelecionada.statusPagamento === "atrasado"
                          ? "bg-bad/15 text-bad"
                          : "bg-warn/15 text-warn"
                      }`}
                    >
                      {LABEL_STATUS_PAGAMENTO[aulaSelecionada.statusPagamento] ??
                        aulaSelecionada.statusPagamento}
                    </span>
                  </dd>
                </div>
              )}

              {aulaSelecionada.pixCopiaCola && (
                <div>
                  <dt className="text-xs text-ink/50 mb-0.5">
                    PIX copia e cola
                  </dt>
                  <dd className="break-all bg-white/70 border border-line rounded-lg p-2 text-xs">
                    {aulaSelecionada.pixCopiaCola}
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
