"use client";

import { useState } from "react";
import Link from "next/link";
import { sair } from "@/app/actions";
import { IconLogout, IconKey, IconMenu, IconChevron } from "./icons";
import SinoNotificacoes, { type NotificacaoSino } from "./SinoNotificacoes";

function iniciais(nome?: string | null) {
  if (!nome) return "?";
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default function Topbar({
  nome,
  papel,
  cadastroHref,
  painelHref = "/",
  notificacoes = [],
  onToggleSidebar,
}: {
  nome?: string | null;
  papel: string;
  cadastroHref?: string;
  painelHref?: string;
  notificacoes?: NotificacaoSino[];
  onToggleSidebar?: () => void;
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <header className="h-16 shrink-0 border-b border-line bg-white flex items-center justify-between px-4 sm:px-6 relative z-30">
      <div className="flex items-center gap-3">
        {onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            aria-label="Alternar menu"
            className="text-ink/50 hover:text-ink transition-colors -ml-1 p-1.5 rounded-lg hover:bg-paper"
          >
            <IconMenu />
          </button>
        )}
        <Link href={painelHref} className="font-display font-bold text-base tracking-tight">
          Personal Class
        </Link>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <SinoNotificacoes notificacoes={notificacoes} />

        <div className="relative">
          <button
            type="button"
            onClick={() => setAberto((v) => !v)}
            className="flex items-center gap-2.5"
          >
            <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
              {iniciais(nome)}
            </span>
            <span className="text-sm font-semibold hidden sm:block">{nome}</span>
            <IconChevron className={`text-ink/40 hidden sm:block transition-transform ${aberto ? "rotate-180" : ""}`} />
          </button>

          {aberto && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setAberto(false)} />
              <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-line bg-white shadow-lg z-20 overflow-hidden">
                <div className="px-4 py-3 border-b border-line">
                  <p className="text-sm font-semibold truncate">{nome}</p>
                  <p className="text-[11px] uppercase tracking-wide text-ink/50">{papel}</p>
                </div>
                {cadastroHref && (
                  <Link
                    href={cadastroHref}
                    onClick={() => setAberto(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-paper transition-colors"
                  >
                    <IconKey className="text-ink/50" />
                    Meu cadastro
                  </Link>
                )}
                <form action={sair}>
                  <button
                    type="submit"
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-bad hover:bg-bad/10 transition-colors"
                  >
                    <IconLogout />
                    Sair
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
