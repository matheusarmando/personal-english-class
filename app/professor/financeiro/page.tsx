import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import { calcularTotaisDashboard } from "@/lib/financeiro/dashboard";
import { statusEfetivo } from "@/lib/financeiro/status";
import WidgetCard from "@/components/WidgetCard";
import EstadoVazio from "@/components/EstadoVazio";

const LABEL_PLANO: Record<string, string> = {
  mensal: "Mensal",
  semestral: "Semestral",
  anual: "Anual",
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarMes(mesISO: string): string {
  const [ano, mes] = mesISO.split("-");
  const nomes = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  return `${nomes[Number(mes) - 1]}/${ano.slice(2)}`;
}

export default async function FinanceiroDashboardPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: contratosRaw } = await supabase
    .from("contratos")
    .select("id, aluno_id, tipo_plano, data_inicio, numero_parcelas")
    .eq("professor_id", profile?.id);

  const contratos = (contratosRaw ?? []).map((c) => ({
    id: c.id,
    alunoId: c.aluno_id,
    tipoPlano: c.tipo_plano,
    dataInicio: c.data_inicio,
    numeroParcelas: c.numero_parcelas,
  })) as any;

  const contratoIds = contratos.map((c: any) => c.id);

  const { data: parcelasRaw } = contratoIds.length
    ? await supabase
        .from("parcelas")
        .select("id, contrato_id, valor_centavos, valor_pago_centavos, vencimento, status, numero, contratos(alunos(nome))")
        .in("contrato_id", contratoIds)
    : { data: [] };

  const parcelas = (parcelasRaw ?? []).map((p: any) => ({
    id: p.id,
    contratoId: p.contrato_id,
    valorCentavos: p.valor_centavos,
    valorPagoCentavos: p.valor_pago_centavos,
    vencimento: p.vencimento,
    status: p.status,
  }));

  const totais = calcularTotaisDashboard(parcelas, contratos);

  const hoje = new Date();
  const em30dias = new Date(hoje.getTime() + 30 * 24 * 60 * 60 * 1000);

  const proximosVencimentos = (parcelasRaw ?? [])
    .filter((p: any) => {
      const efetivo = statusEfetivo({ status: p.status, vencimento: p.vencimento }, hoje);
      return efetivo === "pendente" && new Date(p.vencimento) <= em30dias;
    })
    .sort((a: any, b: any) => a.vencimento.localeCompare(b.vencimento))
    .slice(0, 8);

  const inadimplentes = (parcelasRaw ?? [])
    .filter((p: any) => statusEfetivo({ status: p.status, vencimento: p.vencimento }, hoje) === "atrasada")
    .sort((a: any, b: any) => a.vencimento.localeCompare(b.vencimento));

  const maiorValorMes = Math.max(1, ...totais.previsaoReceitaPorMes.map((m) => m.totalCentavos));

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
            Área do professor
          </p>
          <h1 className="font-display font-semibold text-3xl">Financeiro</h1>
        </div>
        <Link
          href="/professor/financeiro/contratos"
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
        >
          Ver contratos
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <WidgetCard titulo="Recebido no mês">
          <p className="font-display font-bold text-2xl">{formatarReais(totais.recebidoNoMesCentavos)}</p>
          <p className="text-xs text-ink/50 mt-1">de {formatarReais(totais.previstoNoMesCentavos)} previstos</p>
        </WidgetCard>

        <WidgetCard titulo="Inadimplência">
          <p className="font-display font-bold text-2xl text-bad">
            {formatarReais(totais.inadimplencia.totalCentavos)}
          </p>
          <p className="text-xs text-ink/50 mt-1">{totais.inadimplencia.quantidadeParcelas} parcela(s) em atraso</p>
        </WidgetCard>

        <WidgetCard titulo="Contratos perto do fim">
          {totais.contratosPertoDoFim.length === 0 ? (
            <EstadoVazio texto="Nenhum contrato terminando em breve." />
          ) : (
            <p className="font-display font-bold text-2xl">{totais.contratosPertoDoFim.length}</p>
          )}
          <p className="text-xs text-ink/50 mt-1">com 1 ou 2 parcelas restantes — oportunidade de renovação</p>
        </WidgetCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <WidgetCard titulo="Previsão de receita (6 meses)">
          <div role="img" aria-label="Gráfico de barras da previsão de receita mensal">
            <div className="flex items-end gap-3 h-32">
              {totais.previsaoReceitaPorMes.map((m) => (
                <div key={m.mes} className="flex-1 flex flex-col items-center justify-end gap-1 h-full">
                  <span className="text-[10px] text-ink/60 tabular-nums">
                    {(m.totalCentavos / 100).toLocaleString("pt-BR", { maximumFractionDigits: 0 })}
                  </span>
                  <div
                    title={`${formatarMes(m.mes)}: ${formatarReais(m.totalCentavos)}`}
                    className="w-full bg-accent rounded-t"
                    style={{ height: `${Math.max((m.totalCentavos / maiorValorMes) * 100, 2)}%` }}
                  />
                  <span className="text-[10px] text-ink/40">{formatarMes(m.mes)}</span>
                </div>
              ))}
            </div>
          </div>
          <table className="sr-only">
            <caption>Previsão de receita por mês</caption>
            <tbody>
              {totais.previsaoReceitaPorMes.map((m) => (
                <tr key={m.mes}>
                  <td>{formatarMes(m.mes)}</td>
                  <td>{formatarReais(m.totalCentavos)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </WidgetCard>

        <WidgetCard titulo="Ticket médio por plano">
          <ul className="space-y-2 text-sm">
            {(["mensal", "semestral", "anual"] as const).map((plano) => (
              <li key={plano} className="flex items-center justify-between">
                <span className="text-ink/60">{LABEL_PLANO[plano]}</span>
                <span className="font-semibold tabular-nums">
                  {formatarReais(totais.ticketMedioPorPlano[plano])}
                </span>
              </li>
            ))}
          </ul>
        </WidgetCard>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WidgetCard titulo="Vencendo nos próximos 30 dias">
          {proximosVencimentos.length === 0 ? (
            <EstadoVazio texto="Nada vencendo nos próximos 30 dias." />
          ) : (
            <ul className="divide-y divide-line -mx-4">
              {proximosVencimentos.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{p.contratos?.alunos?.nome ?? "—"}</span>
                  <span className="text-ink/50 tabular-nums">
                    {new Date(p.vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })} ·{" "}
                    {formatarReais(p.valor_centavos)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>

        <WidgetCard titulo="Alunos inadimplentes">
          {inadimplentes.length === 0 ? (
            <EstadoVazio texto="Ninguém em atraso." />
          ) : (
            <ul className="divide-y divide-line -mx-4">
              {inadimplentes.map((p: any) => (
                <li key={p.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{p.contratos?.alunos?.nome ?? "—"}</span>
                  <span className="text-bad font-semibold tabular-nums">{formatarReais(p.valor_centavos)}</span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>
      </div>
    </main>
  );
}
