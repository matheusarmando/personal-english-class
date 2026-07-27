import Link from "next/link";

const areas = [
  {
    label: "Aluno",
    desc: "Suas aulas, presença e progresso em um só lugar.",
    href: "/login",
  },
  {
    label: "Professor",
    desc: "Registre aulas e chamada por turma.",
    href: "/login",
  },
  {
    label: "Gestão",
    desc: "Visão geral de turmas, professores e alunos.",
    href: "/login",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-paper text-ink">
      <header className="flex items-center justify-between px-8 py-6 border-b border-line">
        <span className="font-display text-lg tracking-tight">
          Personal English Class
        </span>
        <Link
          href="/login"
          className="text-sm font-medium px-4 py-2 rounded-full border border-ink hover:bg-ink hover:text-paper transition-colors"
        >
          Entrar
        </Link>
      </header>

      <section className="px-8 py-20 max-w-3xl">
        <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-4">
          Controle de aulas
        </p>
        <h1 className="font-display text-5xl leading-tight mb-6">
          A chamada, a turma e o progresso — sempre à mão.
        </h1>
        <p className="text-lg text-ink/70 max-w-xl">
          Um só sistema para acompanhar aulas, presença e desempenho, com
          acesso próprio para cada papel: aluno, professor e gestão.
        </p>
      </section>

      <section className="px-8 pb-24 grid gap-4 sm:grid-cols-3 max-w-4xl">
        {areas.map((area) => (
          <Link
            key={area.label}
            href={area.href}
            className="group block rounded-xl border border-line bg-white/60 p-6 hover:border-accent transition-colors"
          >
            <h2 className="font-display text-xl mb-2 group-hover:text-accent transition-colors">
              {area.label}
            </h2>
            <p className="text-sm text-ink/60">{area.desc}</p>
          </Link>
        ))}
      </section>
    </main>
  );
}
