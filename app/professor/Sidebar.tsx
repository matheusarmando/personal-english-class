"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconDashboard,
  IconUsers,
  IconChat,
  IconExam,
  IconCalendar,
  IconWallet,
  IconSettings,
  IconChevron,
  IconSearch,
  IconChart,
} from "@/components/icons";

type NavLink = { label: string; href: string };
type NavEntry =
  | { type: "link"; label: string; href: string; icon: typeof IconDashboard }
  | { type: "group"; label: string; icon: typeof IconDashboard; items: NavLink[] };

const NAV: NavEntry[] = [
  { type: "link", label: "Painel", href: "/professor", icon: IconDashboard },
  {
    type: "group",
    label: "Alunos",
    icon: IconUsers,
    items: [
      { label: "Meus alunos", href: "/professor/alunos" },
      { label: "Frequência", href: "/professor/frequencia" },
    ],
  },
  {
    type: "group",
    label: "Pedagógico",
    icon: IconExam,
    items: [
      { label: "Tarefas", href: "/professor/tarefas" },
      { label: "Provas", href: "/professor/provas" },
    ],
  },
  {
    type: "group",
    label: "Agenda",
    icon: IconCalendar,
    items: [
      { label: "Agendamentos avulsos", href: "/professor/agendamentos" },
      { label: "Calendário letivo", href: "/professor/calendario-letivo" },
    ],
  },
  {
    type: "group",
    label: "Financeiro",
    icon: IconWallet,
    items: [
      { label: "Painel financeiro", href: "/professor/financeiro" },
      { label: "Contratos", href: "/professor/financeiro/contratos" },
    ],
  },
  {
    type: "group",
    label: "Relatórios",
    icon: IconChart,
    items: [
      { label: "Visão geral", href: "/professor/relatorios" },
      { label: "Financeiro", href: "/professor/relatorios/financeiro" },
      { label: "Frequência", href: "/professor/relatorios/frequencia" },
      { label: "Pedagógico", href: "/professor/relatorios/pedagogico" },
      { label: "Agendamentos", href: "/professor/relatorios/agendamentos" },
      { label: "Retenção", href: "/professor/relatorios/retencao" },
    ],
  },
  {
    type: "group",
    label: "Comunicação",
    icon: IconChat,
    items: [
      { label: "Chat", href: "/professor/chat" },
      { label: "Avisos", href: "/professor/avisos" },
    ],
  },
  {
    type: "group",
    label: "Configurações",
    icon: IconSettings,
    items: [
      { label: "Página pública", href: "/professor/pagina-publica" },
      { label: "WhatsApp", href: "/professor/whatsapp" },
      { label: "Meu cadastro", href: "/professor/cadastro" },
      { label: "Google Calendar", href: "/professor/configuracoes/google-calendar" },
    ],
  },
];

function normaliza(txt: string) {
  return txt.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

export default function Sidebar({ colapsada = false }: { colapsada?: boolean }) {
  const pathname = usePathname();
  const [busca, setBusca] = useState("");

  const grupoAtivo = useMemo(() => {
    for (const entry of NAV) {
      if (entry.type === "group" && entry.items.some((i) => i.href === pathname)) {
        return entry.label;
      }
    }
    return null;
  }, [pathname]);

  const [abertos, setAbertos] = useState<Set<string>>(
    () => new Set(grupoAtivo ? [grupoAtivo] : [])
  );

  function alternar(label: string) {
    setAbertos((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  }

  const termo = normaliza(busca.trim());
  const buscando = !colapsada && termo.length > 0;

  const navFiltrado = NAV.map((entry) => {
    if (entry.type === "link") {
      return normaliza(entry.label).includes(termo) ? entry : null;
    }
    const items = entry.items.filter((i) => normaliza(i.label).includes(termo));
    if (!buscando) return entry;
    if (normaliza(entry.label).includes(termo)) return entry;
    if (items.length === 0) return null;
    return { ...entry, items };
  }).filter(Boolean) as NavEntry[];

  if (colapsada) {
    return (
      <aside className="w-16 shrink-0 border-r border-line bg-white flex flex-col items-center py-3 gap-0.5">
        {NAV.map((entry) => {
          const Icon = entry.icon;
          const href = entry.type === "link" ? entry.href : entry.items[0]?.href ?? "#";
          const ativo =
            entry.type === "link"
              ? pathname === entry.href
              : entry.items.some((i) => i.href === pathname);

          return (
            <Link
              key={entry.label}
              href={href}
              title={entry.label}
              className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
                ativo ? "bg-accentSoft/60 text-accent" : "text-ink/50 hover:text-accent hover:bg-accentSoft/40"
              }`}
            >
              <Icon />
            </Link>
          );
        })}
      </aside>
    );
  }

  return (
    <aside className="w-64 shrink-0 border-r border-line bg-white flex flex-col">
      <div className="p-3 border-b border-line">
        <div className="relative">
          <IconSearch className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink/40" />
          <input
            type="search"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar no menu..."
            className="w-full rounded-lg border border-line bg-paper pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 flex flex-col gap-0.5">
        {navFiltrado.length === 0 && (
          <p className="text-xs text-ink/40 px-2 py-4 text-center">Nada encontrado.</p>
        )}

        {navFiltrado.map((entry) => {
          if (entry.type === "link") {
            const Icon = entry.icon;
            const ativo = pathname === entry.href;
            return (
              <Link
                key={entry.href}
                href={entry.href}
                className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold transition-colors ${
                  ativo
                    ? "bg-accentSoft/60 text-ink"
                    : "text-ink/60 hover:text-accent hover:bg-accentSoft/40"
                }`}
              >
                <Icon className={ativo ? "text-accent" : "text-ink/40"} />
                {entry.label}
              </Link>
            );
          }

          const Icon = entry.icon;
          const aberto = buscando || abertos.has(entry.label);

          return (
            <div key={entry.label}>
              <button
                type="button"
                onClick={() => alternar(entry.label)}
                className="w-full flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold text-ink/60 hover:text-accent hover:bg-accentSoft/40 transition-colors"
              >
                <Icon className="text-ink/40" />
                <span className="flex-1 text-left">{entry.label}</span>
                <IconChevron className={`text-ink/30 transition-transform ${aberto ? "rotate-180" : ""}`} />
              </button>
              {aberto && (
                <div className="ml-8 flex flex-col gap-0.5 mt-0.5 mb-1">
                  {entry.items.map((item) => {
                    const ativo = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`rounded-lg px-2.5 py-1.5 text-sm transition-colors ${
                          ativo
                            ? "bg-accentSoft/60 text-ink font-semibold"
                            : "text-ink/55 hover:text-accent hover:bg-accentSoft/40"
                        }`}
                      >
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}
