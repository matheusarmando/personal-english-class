import Link from "next/link";
import { getProfile } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { label: "Visão geral", href: "/gestao" },
  { label: "Turmas", href: "/gestao" },
  { label: "Professores", href: "/gestao" },
  { label: "Alunos", href: "/gestao" },
];

function iniciais(nome?: string | null) {
  if (!nome) return "?";
  return nome
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export default async function GestaoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();

  return (
    <div className="min-h-screen bg-paper text-ink flex">
      <aside className="w-56 shrink-0 border-r border-line px-4 py-6 flex flex-col gap-6">
        <span className="font-display font-bold text-base tracking-tight block px-2">
          Personal English Class
        </span>
        <nav className="flex flex-col gap-1 flex-1">
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item.label}
              href={item.href}
              className={`text-sm font-semibold rounded-lg px-2.5 py-2 transition-colors ${
                i === 0
                  ? "bg-accentSoft/60 text-ink"
                  : "text-ink/60 hover:text-accent hover:bg-accentSoft/40"
              }`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2.5 border-t border-line pt-4 px-1">
          <span className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold shrink-0">
            {iniciais(profile?.nome)}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{profile?.nome}</p>
            <p className="text-[11px] uppercase tracking-wide text-ink/50">
              Gestão
            </p>
          </div>
        </div>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
