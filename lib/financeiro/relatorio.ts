import { statusEfetivo } from "./status";
import type { StatusParcelaArmazenado } from "./tipos";

export type ParcelaRelatorio = {
  valorCentavos: number;
  valorPagoCentavos: number | null;
  vencimento: string;
  status: StatusParcelaArmazenado;
  contratoId: string;
};

export type ContratoRelatorio = {
  id: string;
  /** Data pura YYYY-MM-DD. */
  dataInicio: string;
};

export type ResultadoRelatorioFinanceiro = {
  recebidoCentavos: number;
  previstoCentavos: number;
  inadimplenciaCentavos: number;
  quantidadeParcelasInadimplentes: number;
  quantidadeParcelasPagas: number;
  contratosNovos: number;
};

/**
 * Agrega o financeiro num intervalo de datas livre (inclusive nas duas
 * pontas) — diferente de calcularTotaisDashboard (dashboard.ts), que é
 * fixo no mês corrente + previsão dos próximos meses. Função pura,
 * mesmo padrão: recebe os dados já carregados, não toca em Supabase.
 */
export function calcularRelatorioFinanceiro(
  parcelas: ParcelaRelatorio[],
  contratos: ContratoRelatorio[],
  dataInicio: string,
  dataFim: string,
  hoje: Date = new Date()
): ResultadoRelatorioFinanceiro {
  let recebidoCentavos = 0;
  let previstoCentavos = 0;
  let inadimplenciaCentavos = 0;
  let quantidadeParcelasInadimplentes = 0;
  let quantidadeParcelasPagas = 0;

  for (const parcela of parcelas) {
    if (parcela.vencimento < dataInicio || parcela.vencimento > dataFim) continue;

    const efetivo = statusEfetivo({ status: parcela.status, vencimento: parcela.vencimento }, hoje);
    if (efetivo === "cancelada") continue;

    previstoCentavos += parcela.valorCentavos;

    if (parcela.status === "paga") {
      recebidoCentavos += parcela.valorPagoCentavos ?? parcela.valorCentavos;
      quantidadeParcelasPagas += 1;
    }

    if (efetivo === "atrasada") {
      inadimplenciaCentavos += parcela.valorCentavos;
      quantidadeParcelasInadimplentes += 1;
    }
  }

  const contratosNovos = contratos.filter(
    (c) => c.dataInicio >= dataInicio && c.dataInicio <= dataFim
  ).length;

  return {
    recebidoCentavos,
    previstoCentavos,
    inadimplenciaCentavos,
    quantidadeParcelasInadimplentes,
    quantidadeParcelasPagas,
    contratosNovos,
  };
}
