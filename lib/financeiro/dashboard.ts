import { statusEfetivo } from "./status";
import type { StatusParcelaArmazenado, TipoPlano } from "./tipos";

export type ParcelaParaDashboard = {
  valorCentavos: number;
  valorPagoCentavos: number | null;
  vencimento: string;
  status: StatusParcelaArmazenado;
  contratoId: string;
};

export type ContratoParaDashboard = {
  id: string;
  alunoId: string;
  tipoPlano: TipoPlano;
  dataInicio: string;
  numeroParcelas: number;
};

export type TotaisDashboard = {
  /** Total previsto por mês (YYYY-MM), pros próximos N meses a partir de hoje. */
  previsaoReceitaPorMes: { mes: string; totalCentavos: number }[];
  recebidoNoMesCentavos: number;
  previstoNoMesCentavos: number;
  inadimplencia: { totalCentavos: number; quantidadeParcelas: number };
  ticketMedioPorPlano: Record<TipoPlano, number>;
  contratosPertoDoFim: string[]; // ids dos contratos com <= 2 parcelas em aberto
};

/**
 * Agrega os totais do dashboard financeiro do professor. Função pura
 * — recebe as parcelas/contratos já carregados do banco e devolve os
 * números prontos pra renderizar, sem tocar em Supabase.
 */
export function calcularTotaisDashboard(
  parcelas: ParcelaParaDashboard[],
  contratos: ContratoParaDashboard[],
  hoje: Date = new Date(),
  mesesPrevisao = 6
): TotaisDashboard {
  const mesAtual = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;

  const previsaoMap = new Map<string, number>();
  for (let i = 0; i < mesesPrevisao; i++) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() + i, 1);
    previsaoMap.set(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, 0);
  }

  let recebidoNoMesCentavos = 0;
  let previstoNoMesCentavos = 0;
  let inadimplenciaTotal = 0;
  let inadimplenciaQtd = 0;

  const valoresPorPlano = new Map<TipoPlano, { totalCentavos: number; quantidade: number }>();
  const contratoPorId = new Map(contratos.map((c) => [c.id, c]));
  const parcelasAbertasPorContrato = new Map<string, number>();

  for (const parcela of parcelas) {
    const mesVencimento = parcela.vencimento.slice(0, 7);
    const efetivo = statusEfetivo({ status: parcela.status, vencimento: parcela.vencimento }, hoje);

    if (previsaoMap.has(mesVencimento) && efetivo !== "cancelada") {
      previsaoMap.set(mesVencimento, (previsaoMap.get(mesVencimento) ?? 0) + parcela.valorCentavos);
    }

    if (mesVencimento === mesAtual && efetivo !== "cancelada") {
      previstoNoMesCentavos += parcela.valorCentavos;
    }
    if (mesVencimento === mesAtual && parcela.status === "paga") {
      recebidoNoMesCentavos += parcela.valorPagoCentavos ?? parcela.valorCentavos;
    }

    if (efetivo === "atrasada") {
      inadimplenciaTotal += parcela.valorCentavos;
      inadimplenciaQtd += 1;
    }

    if (efetivo === "pendente" || efetivo === "atrasada") {
      const contrato = contratoPorId.get(parcela.contratoId);
      if (contrato) {
        parcelasAbertasPorContrato.set(
          parcela.contratoId,
          (parcelasAbertasPorContrato.get(parcela.contratoId) ?? 0) + 1
        );
      }
    }

    if (parcela.status === "paga") {
      const contrato = contratoPorId.get(parcela.contratoId);
      if (contrato) {
        const acumulado = valoresPorPlano.get(contrato.tipoPlano) ?? { totalCentavos: 0, quantidade: 0 };
        acumulado.totalCentavos += parcela.valorPagoCentavos ?? parcela.valorCentavos;
        acumulado.quantidade += 1;
        valoresPorPlano.set(contrato.tipoPlano, acumulado);
      }
    }
  }

  const ticketMedioPorPlano = {} as Record<TipoPlano, number>;
  for (const plano of ["mensal", "semestral", "anual"] as TipoPlano[]) {
    const acumulado = valoresPorPlano.get(plano);
    ticketMedioPorPlano[plano] = acumulado && acumulado.quantidade > 0
      ? Math.round(acumulado.totalCentavos / acumulado.quantidade)
      : 0;
  }

  const contratosPertoDoFim = contratos
    .filter((c) => {
      const abertas = parcelasAbertasPorContrato.get(c.id) ?? 0;
      return abertas > 0 && abertas <= 2;
    })
    .map((c) => c.id);

  return {
    previsaoReceitaPorMes: Array.from(previsaoMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, totalCentavos]) => ({ mes, totalCentavos })),
    recebidoNoMesCentavos,
    previstoNoMesCentavos,
    inadimplencia: { totalCentavos: inadimplenciaTotal, quantidadeParcelas: inadimplenciaQtd },
    ticketMedioPorPlano,
    contratosPertoDoFim,
  };
}
