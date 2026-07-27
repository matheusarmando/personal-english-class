import Link from "next/link";

const NAV_ITEMS = [
  { label: "Cadastro", href: "/aluno/cadastro" },
  { label: "Painel", href: "/aluno" },
];

export default function AlunoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink flex">
      <aside className="w-48 shrink-0 border-r border-line px-4 py-6">
        <span className="font-display text-base tracking-tight block mb-6 px-2">
          Personal English Class
        </span>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-ink/70 hover:text-accent hover:bg-accentSoft/40 transition-colors rounded-lg px-2 py-2"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">{children}</div>
    </div>
  );
}
