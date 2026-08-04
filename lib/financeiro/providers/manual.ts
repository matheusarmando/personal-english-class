import type { SupabaseClient } from "@supabase/supabase-js";
import type {
  BaixarPagamentoInput,
  EstornarPagamentoInput,
  PaymentProvider,
  ResultadoOperacao,
} from "./tipo";

/**
 * Baixa manual registrada pelo próprio professor. A idempotência de
 * verdade (não duplicar baixa) é garantida na função
 * `registrar_pagamento_parcela` do banco — esta classe é só a casca
 * TS que chama a RPC e traduz o resultado.
 */
export class ManualPaymentProvider implements PaymentProvider {
  constructor(private readonly supabase: SupabaseClient) {}

  async baixarPagamento(input: BaixarPagamentoInput): Promise<ResultadoOperacao> {
    const { error } = await this.supabase.rpc("registrar_pagamento_parcela", {
      p_parcela_id: input.parcelaId,
      p_valor_pago_centavos: input.valorPagoCentavos,
      p_data_pagamento: input.dataPagamento,
      p_metodo_pagamento: input.metodoPagamento,
      p_observacao: input.observacao ?? null,
      p_idempotency_key: input.idempotencyKey,
      p_provider: input.provider ?? "manual",
      p_external_payment_id: input.externalPaymentId ?? null,
    });

    if (error) return { ok: false, erro: error.message };
    return { ok: true };
  }

  async estornarPagamento(input: EstornarPagamentoInput): Promise<ResultadoOperacao> {
    const { error } = await this.supabase.rpc("estornar_pagamento_parcela", {
      p_parcela_id: input.parcelaId,
      p_motivo: input.motivo ?? null,
    });

    if (error) return { ok: false, erro: error.message };
    return { ok: true };
  }
}
