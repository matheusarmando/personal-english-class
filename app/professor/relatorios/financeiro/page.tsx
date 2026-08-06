import { createClient, getProfile } from "@/lib/supabase/server";
import { calcularRelatorioFinanceiro } from "@/lib/financeiro/relatorio";
import { periodoMesAtual } from "@/lib/periodo";
import FiltroPeriodo from "@/components/relatorios/FiltroPeriodo";
import EstadoVazio from "@/components/EstadoVazio";

const LABEL_STATUS: Record<string, string> = {
  pendente: "Pendente",
  paga: "Paga",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function RelatorioFinanceiroPage({
  searchParams,
}: {
  searchParams: { de?: string; ate?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const padrao = periodoMesAtual();
  const dataInicio = searchParams.de || padrao.de;
  const dataFim = searchParams.ate || padrao.ate;

  const { data: contratosRaw } = await supabase
    .from("contratos")
    .select("id, data_inicio")
    .eq("professor_id", profile?.id);

  const contratos = contratosRaw ?? [];
  const contratoIds = contratos.map((c) => c.id);

  const { data: parcelasRaw } = contratoIds.length
    ? await supabase
        .from("parcelas")
        .select("valor_centavos, valor_pago_centavos, vencimento, status, contrato_id, contratos(alunos(nome))")
        .in("contrato_id", contratoIds)
        .gte("vencimento", dataInicio)
        .lte("vencimento", dataFim)
        .order("vencimento")
    : { data: [] };

  const parcelas = parcelasRaw ?? [];

  const resultado = calcularRelatorioFinanceiro(
    parcelas.map((p) => ({
      valorCentavos: p.valor_centavos,
      valorPagoCentavos: p.valor_pago_centavos,
      vencimento: p.vencimento,
      status: p.status as "pendente" | "paga" | "cancelada",
      contratoId: p.contrato_id,
    })),
    contratos.map((c) => ({ id: c.id, dataInicio: c.data_inicio })),
    dataInicio,
    dataFim
  );

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <div className="flex items-baseline justify-between mb-8 max-w-3xl">
        <h1 className="font-display font-semibold text-3xl">Relatório financeiro</h1>
        <a
          href={`/api/relatorios/financeiro?de=${dataInicio}&ate=${dataFim}`}
          target="_blank"
          rel="noreferrer"
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-accent transition-colors"
        >
          Exportar PDF
        </a>
      </div>

      <div className="max-w-3xl">
        <FiltroPeriodo de={dataInicio} ate={dataFim} />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Recebido</p>
            <p className="font-display font-bold text-xl mt-1 tabular-nums text-good">
              {formatarReais(resultado.recebidoCentavos)}
            </p>
          </div>
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Previsto</p>
            <p className="font-display font-bold text-xl mt-1 tabular-nums">
              {formatarReais(resultado.previstoCentavos)}
            </p>
          </div>
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Inadimplência</p>
            <p className="font-display font-bold text-xl mt-1 tabular-nums text-bad">
              {formatarReais(resultado.inadimplenciaCentavos)}
            </p>
            <p className="text-xs text-ink/50 mt-0.5">{resultado.quantidadeParcelasInadimplentes} parcela(s)</p>
          </div>
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Contratos novos</p>
            <p className="font-display font-bold text-xl mt-1 tabular-nums">{resultado.contratosNovos}</p>
          </div>
        </div>

        <h2 className="font-display font-semibold text-lg mb-3">Parcelas no período</h2>
        {parcelas.length === 0 ? (
          <EstadoVazio texto="Nenhuma parcela com vencimento nesse período." />
        ) : (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
            {parcelas.map((p: any, i: number) => (
              <li key={i} className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{p.contratos?.alunos?.nome ?? "—"}</p>
                  <p className="text-xs text-ink/50">
                    Vence {new Date(p.vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatarReais(p.valor_centavos)}</p>
                  <span className="text-xs text-ink/50">{LABEL_STATUS[p.status] ?? p.status}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
