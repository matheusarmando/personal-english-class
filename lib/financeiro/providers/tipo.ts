/**
 * Abstração de baixa/estorno de pagamento. Hoje só existe
 * `ManualPaymentProvider` (baixa manual pelo professor), mas a
 * interface já carrega o que um gateway (Stripe/Mercado Pago/Asaas)
 * vai precisar: chave de idempotência (pra reentrega de webhook não
 * duplicar baixa) e o id do pagamento no provedor externo. Plugar um
 * gateway no futuro é só implementar esta interface e um webhook —
 * sem mexer no domínio (parcelas, contratos, RLS).
 */

export type BaixarPagamentoInput = {
  parcelaId: string;
  valorPagoCentavos: number;
  /** Data pura YYYY-MM-DD. */
  dataPagamento: string;
  metodoPagamento: string;
  observacao?: string;
  /** Reenviar a mesma chave numa parcela já paga com essa chave é um no-op. */
  idempotencyKey: string;
  provider?: string;
  externalPaymentId?: string;
};

export type EstornarPagamentoInput = {
  parcelaId: string;
  motivo?: string;
};

export type ResultadoOperacao = { ok: true } | { ok: false; erro: string };

export interface PaymentProvider {
  baixarPagamento(input: BaixarPagamentoInput): Promise<ResultadoOperacao>;
  estornarPagamento(input: EstornarPagamentoInput): Promise<ResultadoOperacao>;
}
