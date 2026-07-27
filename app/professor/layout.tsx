import Link from "next/link";

const NAV_ITEMS = [
  { label: "Painel", href: "/professor" },
  { label: "Alunos", href: "/professor/alunos" },
  { label: "Agendamentos avulsos", href: "/professor/agendamentos" },
];

export default function ProfessorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <nav className="border-b border-line px-8 py-4 flex items-center gap-6">
        <span className="font-display text-lg tracking-tight mr-4">
          Personal English Class
        </span>
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="text-sm font-medium text-ink/70 hover:text-accent transition-colors"
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
