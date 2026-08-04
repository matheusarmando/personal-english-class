export type TipoPlano = "mensal" | "semestral" | "anual";

export type StatusContrato = "ativo" | "concluido" | "cancelado";

/** Status gravado no banco. "atrasada" nunca é escrito — é sempre
 * derivado de `status === "pendente" && vencimento < hoje`. */
export type StatusParcelaArmazenado = "pendente" | "paga" | "cancelada";

export type StatusParcelaEfetivo = StatusParcelaArmazenado | "atrasada";

export type ParcelaGerada = {
  numero: number;
  valorCentavos: number;
  /** Data pura no formato YYYY-MM-DD, sem hora/fuso. */
  vencimento: string;
};

export type Parcela = {
  id: string;
  contratoId: string;
  numero: number;
  valorCentavos: number;
  vencimento: string;
  status: StatusParcelaArmazenado;
  dataPagamento: string | null;
  valorPagoCentavos: number | null;
  metodoPagamento: string | null;
};

export type Contrato = {
  id: string;
  professorId: string;
  alunoId: string;
  tipoPlano: TipoPlano;
  numeroParcelas: number;
  valorTotalCentavos: number;
  valorParcelaCentavos: number;
  dataInicio: string;
  diaVencimento: number;
  status: StatusContrato;
};
