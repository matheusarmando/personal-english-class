"use client";

import { cloneElement, isValidElement, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Topbar from "./Topbar";
import type { NotificacaoSino } from "./SinoNotificacoes";

export default function DashboardShell({
  nome,
  papel,
  cadastroHref,
  painelHref,
  notificacoes,
  sidebar,
  children,
}: {
  nome?: string | null;
  papel: string;
  cadastroHref?: string;
  painelHref?: string;
  notificacoes?: NotificacaoSino[];
  sidebar: React.ReactNode;
  children: React.ReactNode;
}) {
  // Desktop: expandido <-> compacto (ícones). Mobile: gaveta fechada <-> aberta
  // por cima do conteúdo — dois conceitos diferentes que a tela larga e a
  // estreita usam do mesmo jeito, então ficam em estados separados.
  const [colapsada, setColapsada] = useState(false);
  const [menuAberto, setMenuAberto] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMenuAberto(false);
  }, [pathname]);

  function comEstado(colapsadaProp: boolean) {
    return isValidElement(sidebar)
      ? cloneElement(sidebar as React.ReactElement<{ colapsada?: boolean }>, { colapsada: colapsadaProp })
      : sidebar;
  }

  function alternarMenu() {
    setColapsada((v) => !v);
    setMenuAberto((v) => !v);
  }

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Topbar
        nome={nome}
        papel={papel}
        cadastroHref={cadastroHref}
        painelHref={painelHref}
        notificacoes={notificacoes}
        onToggleSidebar={alternarMenu}
      />
      <div className="flex flex-1 min-h-0">
        {/* Desktop (md+): sidebar sempre visível, respeita colapsar/expandir. */}
        <div className="hidden md:block">{comEstado(colapsada)}</div>

        {/* Mobile (abaixo de md): gaveta off-canvas, sempre expandida. */}
        {menuAberto && (
          <div
            className="fixed inset-x-0 top-16 bottom-0 bg-ink/40 z-40 md:hidden"
            onClick={() => setMenuAberto(false)}
          />
        )}
        <div
          className={`fixed left-0 top-16 bottom-0 z-50 bg-white shadow-lg overflow-y-auto transition-transform duration-200 md:hidden ${
            menuAberto ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {comEstado(false)}
        </div>

        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
