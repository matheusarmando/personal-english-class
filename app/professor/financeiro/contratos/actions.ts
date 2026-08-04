"use server";

import { randomUUID } from "crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";
import { gerarParcelas } from "@/lib/financeiro/parcelas";
import { ManualPaymentProvider } from "@/lib/financeiro/providers/manual";
import type { TipoPlano } from "@/lib/financeiro/tipos";

function paraCentavos(valorReais: string): number {
  return Math.round(Number(valorReais.replace(",", ".")) * 100);
}

export async function criarContrato(formData: FormData) {
  const supabase = createClient();

  const alunoId = formData.get("aluno_id") as string;
  const tipoPlano = formData.get("tipo_plano") as TipoPlano;
  const valorParcelaCentavos = paraCentavos(formData.get("valor_parcela") as string);
  const dataInicio = formData.get("data_inicio") as string;
  const diaVencimento = Number(formData.get("dia_vencimento"));
  const observacoes = (formData.get("observacoes") as string) || null;
  const pixCopiaCola = (formData.get("pix_copia_cola") as string) || null;

  const { data: plano } = await supabase
    .from("planos_config")
    .select("numero_parcelas")
    .eq("tipo_plano", tipoPlano)
    .single();

  if (!plano) {
    return;
  }

  const numeroParcelas = plano.numero_parcelas;
  const valorTotalCentavos = valorParcelaCentavos * numeroParcelas;

  const parcelas = gerarParcelas({
    dataInicio,
    diaVencimento,
    numeroParcelas,
    valorTotalCentavos,
  });

  const { data: contratoId, error } = await supabase.rpc("criar_contrato", {
    p_aluno_id: alunoId,
    p_tipo_plano: tipoPlano,
    p_valor_total_centavos: valorTotalCentavos,
    p_valor_parcela_centavos: valorParcelaCentavos,
    p_data_inicio: dataInicio,
    p_dia_vencimento: diaVencimento,
    p_numero_parcelas: numeroParcelas,
    p_observacoes: observacoes,
    p_parcelas: parcelas.map((p) => ({
      numero: p.numero,
      valor_centavos: p.valorCentavos,
      vencimento: p.vencimento,
    })),
    p_pix_copia_cola: pixCopiaCola,
  });

  if (error) {
    console.error("Erro ao criar contrato:", error.message);
    return;
  }

  revalidatePath("/professor/financeiro/contratos");
  redirect(`/professor/financeiro/contratos/${contratoId}`);
}

export async function editarContrato(contratoId: string, formData: FormData) {
  const supabase = createClient();

  const valorParcelaCentavos = paraCentavos(formData.get("valor_parcela") as string);
  const diaVencimento = Number(formData.get("dia_vencimento"));
  const numeroParcelasNovo = Number(formData.get("numero_parcelas"));
  const observacoes = (formData.get("observacoes") as string) || null;
  const motivo = (formData.get("motivo") as string) || null;
  const pixCopiaCola = (formData.get("pix_copia_cola") as string) || null;

  const { data: parcelasPagas } = await supabase
    .from("parcelas")
    .select("numero, valor_centavos")
    .eq("contrato_id", contratoId)
    .eq("status", "paga")
    .order("numero", { ascending: false });

  const quantidadePagas = parcelasPagas?.length ?? 0;
  const numeroInicial = (parcelasPagas?.[0]?.numero ?? 0) + 1;
  const numeroParcelasAbertas = Math.max(numeroParcelasNovo - quantidadePagas, 0);
  const valorTotalPago = (parcelasPagas ?? []).reduce((acc, p) => acc + p.valor_centavos, 0);

  // Data de partida das novas parcelas em aberto é hoje — o histórico
  // das parcelas já pagas não muda, só o que ainda vai vencer.
  const hojeISO = new Date().toISOString().slice(0, 10);

  const parcelasAbertas =
    numeroParcelasAbertas > 0
      ? gerarParcelas({
          dataInicio: hojeISO,
          diaVencimento,
          numeroParcelas: numeroParcelasAbertas,
          valorTotalCentavos: valorParcelaCentavos * numeroParcelasAbertas,
          numeroInicial,
        })
      : [];

  const valorTotalCentavos = valorTotalPago + valorParcelaCentavos * numeroParcelasAbertas;

  const { error } = await supabase.rpc("editar_contrato", {
    p_contrato_id: contratoId,
    p_valor_total_centavos: valorTotalCentavos,
    p_valor_parcela_centavos: valorParcelaCentavos,
    p_data_inicio: hojeISO,
    p_dia_vencimento: diaVencimento,
    p_numero_parcelas: numeroParcelasNovo,
    p_observacoes: observacoes,
    p_motivo: motivo,
    p_parcelas_abertas: parcelasAbertas.map((p) => ({
      numero: p.numero,
      valor_centavos: p.valorCentavos,
      vencimento: p.vencimento,
    })),
    p_pix_copia_cola: pixCopiaCola,
  });

  revalidatePath(`/professor/financeiro/contratos/${contratoId}`);

  if (error) {
    return { ok: false, erro: error.message };
  }
  return { ok: true, erro: null };
}

export async function cancelarContrato(contratoId: string, formData: FormData) {
  const supabase = createClient();
  const motivo = (formData.get("motivo") as string) || null;

  await supabase.rpc("cancelar_contrato", { p_contrato_id: contratoId, p_motivo: motivo });

  revalidatePath(`/professor/financeiro/contratos/${contratoId}`);
  revalidatePath("/professor/financeiro/contratos");
}

export async function registrarPagamento(parcelaId: string, formData: FormData) {
  const supabase = createClient();
  const provider = new ManualPaymentProvider(supabase);

  const valorPagoCentavos = paraCentavos(formData.get("valor_pago") as string);
  const dataPagamento = formData.get("data_pagamento") as string;
  const metodoPagamento = formData.get("metodo_pagamento") as string;
  const observacao = (formData.get("observacao") as string) || undefined;

  const resultado = await provider.baixarPagamento({
    parcelaId,
    valorPagoCentavos,
    dataPagamento,
    metodoPagamento,
    observacao,
    idempotencyKey: `manual:${parcelaId}:${randomUUID()}`,
  });

  revalidatePath("/professor/financeiro");
  revalidatePath("/professor/financeiro/contratos");

  return resultado;
}

export async function estornarPagamento(parcelaId: string, formData: FormData) {
  const supabase = createClient();
  const provider = new ManualPaymentProvider(supabase);
  const motivo = (formData.get("motivo") as string) || undefined;

  const resultado = await provider.estornarPagamento({ parcelaId, motivo });

  revalidatePath("/professor/financeiro");
  revalidatePath("/professor/financeiro/contratos");

  return resultado;
}

export async function aprovarComprovante(comprovanteId: string, formData: FormData) {
  const supabase = createClient();

  const valorPagoCentavos = paraCentavos(formData.get("valor_pago") as string);
  const dataPagamento = formData.get("data_pagamento") as string;
  const metodoPagamento = (formData.get("metodo_pagamento") as string) || "comprovante";

  const { error } = await supabase.rpc("aprovar_comprovante", {
    p_comprovante_id: comprovanteId,
    p_valor_pago_centavos: valorPagoCentavos,
    p_data_pagamento: dataPagamento,
    p_metodo_pagamento: metodoPagamento,
  });

  revalidatePath("/professor/financeiro");
  revalidatePath("/professor/financeiro/contratos");

  if (error) return { ok: false, erro: error.message };
  return { ok: true, erro: null };
}

export async function rejeitarComprovante(comprovanteId: string, formData: FormData) {
  const supabase = createClient();
  const motivo = (formData.get("motivo") as string) || null;

  await supabase.rpc("rejeitar_comprovante", { p_comprovante_id: comprovanteId, p_motivo: motivo });

  revalidatePath("/professor/financeiro");
  revalidatePath("/professor/financeiro/contratos");
}
