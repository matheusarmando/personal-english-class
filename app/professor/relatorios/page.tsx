import Link from "next/link";

const RELATORIOS = [
  {
    href: "/professor/relatorios/financeiro",
    titulo: "Financeiro",
    descricao: "Recebido, previsto e inadimplência num intervalo de datas, com exportação em PDF.",
  },
  {
    href: "/professor/relatorios/frequencia",
    titulo: "Frequência",
    descricao: "Aulas agendadas, concluídas e canceladas por aluno, num período.",
  },
  {
    href: "/professor/relatorios/pedagogico",
    titulo: "Pedagógico",
    descricao: "Notas e entregas de tarefas e provas, consolidadas por aluno.",
  },
  {
    href: "/professor/relatorios/agendamentos",
    titulo: "Agendamentos",
    descricao: "Volume de remarcações, cancelamentos e aulas extras solicitadas pelos alunos.",
  },
  {
    href: "/professor/relatorios/retencao",
    titulo: "Retenção",
    descricao: "Alunos sem aula recente e aniversariantes do mês.",
  },
];

export default function RelatoriosPage() {
  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Relatórios</h1>

      <div className="max-w-3xl grid grid-cols-1 sm:grid-cols-2 gap-4">
        {RELATORIOS.map((r) => (
          <Link
            key={r.href}
            href={r.href}
            className="block bg-white border border-line rounded-xl p-5 hover:border-accent transition-colors"
          >
            <p className="font-display font-semibold text-base mb-1">{r.titulo}</p>
            <p className="text-sm text-ink/60">{r.descricao}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
