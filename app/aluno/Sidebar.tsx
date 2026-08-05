"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  IconUser,
  IconDashboard,
  IconWallet,
  IconExam,
  IconChat,
  IconDocument,
  IconCalendar,
} from "@/components/icons";

const NAV_ITEMS = [
  { label: "Painel", href: "/aluno", icon: IconDashboard },
  { label: "Frequência", href: "/aluno/frequencia", icon: IconCalendar },
  { label: "Tarefas", href: "/aluno/tarefas", icon: IconExam },
  { label: "Provas", href: "/aluno/provas", icon: IconDocument },
  { label: "Chat", href: "/aluno/chat", icon: IconChat },
  { label: "Financeiro", href: "/aluno/financeiro", icon: IconWallet },
  { label: "Cadastro", href: "/aluno/cadastro", icon: IconUser },
];

export default function Sidebar({ colapsada = false }: { colapsada?: boolean }) {
  const pathname = usePathname();

  if (colapsada) {
    return (
      <aside className="w-16 shrink-0 border-r border-line bg-white flex flex-col items-center py-3 gap-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const ativo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
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
    <aside className="w-56 shrink-0 border-r border-line bg-white px-4 py-6">
      <nav className="flex flex-col gap-1">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const ativo = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 text-sm font-semibold rounded-lg px-2.5 py-2 transition-colors ${
                ativo
                  ? "bg-accentSoft/60 text-ink"
                  : "text-ink/60 hover:text-accent hover:bg-accentSoft/40"
              }`}
            >
              <Icon className={ativo ? "text-accent" : "text-ink/40"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
