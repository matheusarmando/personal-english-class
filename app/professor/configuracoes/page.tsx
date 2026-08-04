import Link from "next/link";
import { IconCalendar } from "@/components/icons";

const SECOES = [
  {
    titulo: "Google Calendar",
    descricao: "Conecte sua agenda pessoal pra evitar conflito de horário ao agendar aulas.",
    href: "/professor/configuracoes/google-calendar",
    icon: IconCalendar,
  },
];

export default function ConfiguracoesPage() {
  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Configurações</h1>

      <div className="max-w-xl grid gap-3">
        {SECOES.map((secao) => {
          const Icon = secao.icon;
          return (
            <Link
              key={secao.href}
              href={secao.href}
              className="flex items-center gap-3 bg-white border border-line rounded-xl p-4 hover:border-accent transition-colors"
            >
              <span className="w-10 h-10 rounded-lg bg-accentSoft text-accent flex items-center justify-center shrink-0">
                <Icon />
              </span>
              <div>
                <p className="text-sm font-semibold">{secao.titulo}</p>
                <p className="text-xs text-ink/50">{secao.descricao}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
