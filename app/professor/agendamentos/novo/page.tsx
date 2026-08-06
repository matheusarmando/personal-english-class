import Link from "next/link";
import FormNovoAgendamento from "../FormNovoAgendamento";

export default function NovoAgendamentoPage() {
  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <Link
        href="/professor/agendamentos"
        className="text-sm text-ink/50 hover:text-ink transition-colors"
      >
        ← Voltar
      </Link>
      <h1 className="font-display font-semibold text-3xl mt-2 mb-2">Novo agendamento</h1>
      <p className="text-xs text-ink/50 mb-8 max-w-2xl">
        Para compromissos pontuais que não fazem parte da agenda recorrente de
        um aluno já cadastrado — por exemplo, um teste de proficiência ou uma
        aula experimental.
      </p>

      <div className="max-w-2xl">
        <FormNovoAgendamento />
      </div>
    </main>
  );
}
