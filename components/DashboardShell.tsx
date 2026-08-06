"use client";

import { cloneElement, isValidElement, useState } from "react";
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
  const [colapsada, setColapsada] = useState(false);

  const sidebarComEstado = isValidElement(sidebar)
    ? cloneElement(sidebar as React.ReactElement<{ colapsada?: boolean }>, { colapsada })
    : sidebar;

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      <Topbar
        nome={nome}
        papel={papel}
        cadastroHref={cadastroHref}
        painelHref={painelHref}
        notificacoes={notificacoes}
        onToggleSidebar={() => setColapsada((v) => !v)}
      />
      <div className="flex flex-1 min-h-0">
        {sidebarComEstado}
        <div className="flex-1">{children}</div>
      </div>
    </div>
  );
}
