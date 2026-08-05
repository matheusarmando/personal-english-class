import { createClient, getProfile } from "@/lib/supabase/server";
import { periodoMesAtual } from "@/lib/periodo";
import FiltroPeriodo from "@/components/relatorios/FiltroPeriodo";
import EstadoVazio from "@/components/EstadoVazio";

const LABEL_TIPO: Record<string, string> = {
  remarcacao: "Remarcação",
  cancelamento: "Cancelamento",
  aula_extra: "Aula extra",
};

export default async function RelatorioAgendamentosPage({
  searchParams,
}: {
  searchParams: { de?: string; ate?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const padrao = periodoMesAtual();
  const dataInicio = searchParams.de || padrao.de;
  const dataFim = searchParams.ate || padrao.ate;
  const inicioTimestamp = `${dataInicio}T00:00:00.000Z`;
  const fimTimestamp = `${dataFim}T23:59:59.999Z`;

  const { data: solicitacoes } = await supabase
    .from("solicitacoes_agendamento")
    .select("tipo, status, created_at")
    .eq("professor_id", profile?.id)
    .gte("created_at", inicioTimestamp)
    .lte("created_at", fimTimestamp);

  const lista = solicitacoes ?? [];

  const porTipo = { remarcacao: 0, cancelamento: 0, aula_extra: 0 } as Record<string, number>;
  const porStatus = { pendente: 0, aprovada: 0, recusada: 0 } as Record<string, number>;
  for (const s of lista) {
    porTipo[s.tipo] = (porTipo[s.tipo] ?? 0) + 1;
    porStatus[s.status] = (porStatus[s.status] ?? 0) + 1;
  }

  const decididas = porStatus.aprovada + porStatus.recusada;
  const taxaAprovacao = decididas > 0 ? Math.round((porStatus.aprovada / decididas) * 100) : null;

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Relatório de agendamentos</h1>

      <div className="max-w-3xl">
        <FiltroPeriodo de={dataInicio} ate={dataFim} />

        {lista.length === 0 ? (
          <EstadoVazio texto="Nenhuma solicitação de agendamento nesse período." />
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
              <div className="border border-line rounded-xl p-4 bg-white">
                <p className="text-[11px] uppercase tracking-wide text-ink/50">Total</p>
                <p className="font-display font-bold text-2xl mt-1 tabular-nums">{lista.length}</p>
              </div>
              <div className="border border-line rounded-xl p-4 bg-white">
                <p className="text-[11px] uppercase tracking-wide text-ink/50">Aprovadas</p>
                <p className="font-display font-bold text-2xl mt-1 tabular-nums text-good">{porStatus.aprovada}</p>
              </div>
              <div className="border border-line rounded-xl p-4 bg-white">
                <p className="text-[11px] uppercase tracking-wide text-ink/50">Recusadas</p>
                <p className="font-display font-bold text-2xl mt-1 tabular-nums text-bad">{porStatus.recusada}</p>
              </div>
              <div className="border border-line rounded-xl p-4 bg-white">
                <p className="text-[11px] uppercase tracking-wide text-ink/50">Taxa de aprovação</p>
                <p className="font-display font-bold text-2xl mt-1 tabular-nums">
                  {taxaAprovacao == null ? "—" : `${taxaAprovacao}%`}
                </p>
              </div>
            </div>

            <h2 className="font-display font-semibold text-lg mb-3">Por tipo</h2>
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white mb-6">
              {Object.entries(porTipo).map(([tipo, quantidade]) => (
                <li key={tipo} className="flex items-center justify-between px-4 py-3 text-sm">
                  <span>{LABEL_TIPO[tipo] ?? tipo}</span>
                  <span className="font-semibold tabular-nums">{quantidade}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </main>
  );
}
