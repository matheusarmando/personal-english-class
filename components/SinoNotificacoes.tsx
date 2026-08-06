"use client";

import { useState } from "react";
import { marcarNotificacaoComoLida, marcarTodasNotificacoesComoLidas } from "@/app/actions";
import { IconBell } from "./icons";

export type NotificacaoSino = {
  id: string;
  titulo: string;
  mensagem: string;
  lida: boolean;
};

export default function SinoNotificacoes({ notificacoes }: { notificacoes: NotificacaoSino[] }) {
  const [aberto, setAberto] = useState(false);
  const naoLidas = notificacoes.filter((n) => !n.lida).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Notificações"
        className="relative text-ink/50 hover:text-ink transition-colors p-1.5 rounded-lg hover:bg-paper"
      >
        <IconBell />
        {naoLidas > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[1rem] h-4 px-1 rounded-full bg-bad text-white text-[10px] font-bold flex items-center justify-center">
            {naoLidas > 9 ? "9+" : naoLidas}
          </span>
        )}
      </button>

      {aberto && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-line bg-white shadow-lg z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-line">
              <p className="text-sm font-semibold">Notificações</p>
              {naoLidas > 0 && (
                <form action={marcarTodasNotificacoesComoLidas}>
                  <button type="submit" className="text-xs font-semibold text-accent hover:underline">
                    Marcar todas como lidas
                  </button>
                </form>
              )}
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notificacoes.length === 0 ? (
                <p className="text-sm text-ink/50 text-center py-6">Nenhuma notificação.</p>
              ) : (
                <ul className="divide-y divide-line">
                  {notificacoes.map((n) => (
                    <li key={n.id} className={`px-4 py-3 ${n.lida ? "" : "bg-accentSoft/30"}`}>
                      <div className="flex items-start gap-2">
                        {!n.lida && <span className="w-1.5 h-1.5 rounded-full bg-accent mt-1.5 shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{n.titulo}</p>
                          <p className="text-xs text-ink/50 line-clamp-2">{n.mensagem}</p>
                        </div>
                        {!n.lida && (
                          <form action={marcarNotificacaoComoLida.bind(null, n.id)}>
                            <button
                              type="submit"
                              title="Marcar como lida"
                              className="text-ink/30 hover:text-accent shrink-0"
                            >
                              ✓
                            </button>
                          </form>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
