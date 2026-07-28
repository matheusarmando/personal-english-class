"use client";

import Link from "next/link";
import { IconDashboard, IconCalendar, IconUser, IconUsers } from "@/components/icons";

const NAV_ITEMS = [
  { label: "Visão geral", href: "/gestao", icon: IconDashboard },
  { label: "Turmas", href: "/gestao", icon: IconCalendar },
  { label: "Professores", href: "/gestao", icon: IconUser },
  { label: "Alunos", href: "/gestao", icon: IconUsers },
];

export default function Sidebar({ colapsada = false }: { colapsada?: boolean }) {
  if (colapsada) {
    return (
      <aside className="w-16 shrink-0 border-r border-line bg-white flex flex-col items-center py-3 gap-0.5">
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              title={item.label}
              className={`w-11 h-11 rounded-lg flex items-center justify-center transition-colors ${
                i === 0 ? "bg-accentSoft/60 text-accent" : "text-ink/50 hover:text-accent hover:bg-accentSoft/40"
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
        {NAV_ITEMS.map((item, i) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-2.5 text-sm font-semibold rounded-lg px-2.5 py-2 transition-colors ${
                i === 0
                  ? "bg-accentSoft/60 text-ink"
                  : "text-ink/60 hover:text-accent hover:bg-accentSoft/40"
              }`}
            >
              <Icon className={i === 0 ? "text-accent" : "text-ink/40"} />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
