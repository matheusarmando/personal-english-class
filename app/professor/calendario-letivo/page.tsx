const FERIADOS_2026 = [
  { data: "2026-01-01", nome: "Confraternização Universal" },
  { data: "2026-02-16", nome: "Carnaval (segunda-feira)" },
  { data: "2026-02-17", nome: "Carnaval (terça-feira)" },
  { data: "2026-04-03", nome: "Sexta-feira Santa" },
  { data: "2026-04-21", nome: "Tiradentes" },
  { data: "2026-05-01", nome: "Dia do Trabalho" },
  { data: "2026-06-04", nome: "Corpus Christi" },
  { data: "2026-09-07", nome: "Independência do Brasil" },
  { data: "2026-10-12", nome: "Nossa Senhora Aparecida" },
  { data: "2026-11-02", nome: "Finados" },
  { data: "2026-11-15", nome: "Proclamação da República" },
  { data: "2026-11-20", nome: "Dia da Consciência Negra" },
  { data: "2026-12-25", nome: "Natal" },
];

export default function CalendarioLetivoPage() {
  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-2">Calendário letivo</h1>
      <p className="text-sm text-ink/60 mb-8">
        Feriados nacionais de 2026 — use como referência pra evitar marcar
        aulas nessas datas.
      </p>

      <div className="max-w-xl border border-line rounded-xl bg-white overflow-hidden">
        <ul className="divide-y divide-line">
          {FERIADOS_2026.map((f) => {
            const passado = f.data < hoje;
            return (
              <li
                key={f.data}
                className={`flex items-center justify-between px-4 py-3 ${
                  passado ? "opacity-40" : ""
                }`}
              >
                <span className="text-sm font-medium">{f.nome}</span>
                <span className="text-xs text-ink/50 tabular-nums">
                  {new Date(f.data + "T00:00:00").toLocaleDateString("pt-BR", {
                    day: "2-digit",
                    month: "long",
                    weekday: "short",
                  })}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
