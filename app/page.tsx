import Link from "next/link";

const PARA_QUEM = [
  {
    label: "Aluno",
    desc: "Vê a próxima aula, o link certo e se o pagamento está em dia — direto no calendário do mês.",
  },
  {
    label: "Professor",
    desc: "Cadastra alunos, agenda teste de proficiência ou aula experimental e organiza a agenda do mês.",
  },
  {
    label: "Gestão",
    desc: "Acompanha turmas, professores e alunos ativos num painel só, sem precisar perguntar a ninguém.",
  },
];

const FEATURES = [
  {
    titulo: "Calendário mensal",
    desc: "Todas as aulas e agendamentos avulsos num único mês, com um clique para ver os detalhes.",
  },
  {
    titulo: "Cobrança via PIX",
    desc: "Copia e cola vinculado a cada aluno — sem precisar procurar em outra conversa.",
  },
  {
    titulo: "Link de aula",
    desc: "Cada aluno com seu link salvo, pronto pra copiar antes do horário.",
  },
  {
    titulo: "Acesso por papel",
    desc: "Aluno, professor e gestão veem exatamente o que precisam — nada a mais.",
  },
];

export default function LandingPage() {
  return (
    <main className="bg-paper text-ink">
      <nav className="flex items-center justify-between px-6 sm:px-10 py-6 max-w-6xl mx-auto">
        <span className="font-display font-bold text-lg tracking-tight">
          Personal English Class
        </span>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-sm font-semibold px-4 py-2 rounded-lg border border-line hover:border-ink transition-colors"
          >
            Entrar
          </Link>
          <Link
            href="/cadastro"
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-accent text-white hover:-translate-y-px transition-transform"
          >
            Cadastre-se
          </Link>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 sm:px-10 pt-8 pb-20 grid md:grid-cols-2 gap-12 items-center">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-accent mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Ensino individual de inglês
          </span>
          <h1 className="font-display font-bold text-4xl sm:text-5xl leading-[1.06] tracking-tight text-balance">
            Sua agenda de inglês, sem grupos de WhatsApp perdidos.
          </h1>
          <p className="mt-5 text-lg text-ink/60 max-w-md leading-relaxed">
            Marque aulas, acompanhe pagamentos e envie o link certo pro aluno
            certo — numa tela só, sem depender de planilha ou print de
            conversa.
          </p>
          <div className="mt-8 flex items-center gap-3">
            <Link
              href="/cadastro"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg bg-accent text-white hover:-translate-y-px transition-transform"
            >
              Começar agora
            </Link>
            <Link
              href="/login"
              className="text-sm font-semibold px-5 py-2.5 rounded-lg border border-line hover:border-ink transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
        </div>

        <div className="relative h-80 sm:h-[22rem]">
          <div className="absolute inset-0 translate-x-4 translate-y-4 rotate-3 rounded-2xl border border-line bg-white/50" />
          <div className="absolute inset-0 -rotate-2 rounded-2xl border border-line bg-white shadow-xl p-6 flex flex-col gap-3">
            <span className="absolute -top-3 right-6 text-[11px] font-bold px-2.5 py-1 rounded-full bg-good/15 text-good shadow-sm">
              Pago
            </span>
            <div className="flex items-baseline justify-between">
              <h3 className="font-display font-bold text-lg">
                Quinta-feira
              </h3>
              <span className="text-xs text-ink/50">30 de julho</span>
            </div>

            <div className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5">
              <span className="font-mono text-xs tabular-nums text-ink/50 w-11 shrink-0">
                09:00
              </span>
              <span className="text-sm font-semibold flex-1">
                Marina Duarte
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-good/15 text-good">
                Pago
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5">
              <span className="font-mono text-xs tabular-nums text-ink/50 w-11 shrink-0">
                14:30
              </span>
              <span className="text-sm font-semibold flex-1">
                Teste de proficiência — Rafael N.
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-line/50 text-ink/50">
                Avulso
              </span>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-paper px-3 py-2.5">
              <span className="font-mono text-xs tabular-nums text-ink/50 w-11 shrink-0">
                18:00
              </span>
              <span className="text-sm font-semibold flex-1">
                Beatriz Lins
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-warn/15 text-warn">
                Pendente
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 sm:px-10 pb-20">
        <div className="max-w-md mb-10">
          <h2 className="font-display font-bold text-3xl">
            Uma área para cada papel
          </h2>
          <p className="mt-2 text-ink/60">
            O mesmo calendário, adaptado ao que cada pessoa precisa enxergar.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-5">
          {PARA_QUEM.map((item) => (
            <div
              key={item.label}
              className="rounded-2xl border border-line bg-white p-6"
            >
              <span className="block w-9 h-9 rounded-lg bg-accent mb-4" />
              <h3 className="font-display font-bold text-lg mb-2">
                {item.label}
              </h3>
              <p className="text-sm text-ink/60 leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-line bg-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {FEATURES.map((f) => (
            <div key={f.titulo} className="flex flex-col gap-2">
              <span className="w-7 h-7 rounded-full border-2 border-accent" />
              <h4 className="font-display font-bold text-sm">{f.titulo}</h4>
              <p className="text-sm text-ink/60 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 sm:px-10 py-10 flex items-center justify-between text-sm text-ink/50">
        <span>Personal English Class</span>
        <span>Ensino individual, sem fricção</span>
      </footer>
    </main>
  );
}
