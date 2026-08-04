import type { StatusParcelaArmazenado, StatusParcelaEfetivo } from "./tipos";

/**
 * Espelha a view SQL `parcelas_com_status_efetivo`: "atrasada" nunca
 * é um valor gravado, é sempre calculado a partir de vencimento vs.
 * hoje. Mantém o front consistente com o banco sem depender de
 * nenhum job pra "virar" o status.
 */
export function statusEfetivo(
  parcela: { status: StatusParcelaArmazenado; vencimento: string },
  hoje: Date = new Date()
): StatusParcelaEfetivo {
  if (parcela.status !== "pendente") return parcela.status;

  const hojeISO = paraDataISO(hoje);
  return parcela.vencimento < hojeISO ? "atrasada" : "pendente";
}

function paraDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}
