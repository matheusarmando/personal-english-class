import { notFound } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { statusEfetivo } from "@/lib/financeiro/status";
import { cancelarContrato } from "../actions";
import EditarContratoForm from "./EditarContratoForm";
import AcoesParcela from "./AcoesParcela";
import ConfirmarAcao from "@/components/ConfirmarAcao";

const LABEL_PLANO: Record<string, string> = {
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const LABEL_STATUS_PARCELA: Record<string, string> = {
  pendente: "Pendente",
  paga: "Paga",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function DetalheContratoPage({ params }: { params: { id: string } }) {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: contrato } = await supabase
    .from("contratos")
    .select(
      "id, tipo_plano, valor_total_centavos, valor_parcela_centavos, numero_parcelas, data_inicio, dia_vencimento, status, observacoes, pix_copia_cola, alunos(nome, telefone)"
    )
    .eq("id", params.id)
    .eq("professor_id", profile?.id)
    .single();

  if (!contrato) notFound();

  const { data: parcelas } = await supabase
    .from("parcelas")
    .select("id, numero, valor_centavos, vencimento, status, data_pagamento, valor_pago_centavos, metodo_pagamento")
    .eq("contrato_id", contrato.id)
    .order("numero");

  const { data: comprovantesPendentes } = await supabase
    .from("parcela_comprovantes")
    .select("id, parcela_id, arquivo_path, nome_arquivo")
    .eq("status", "pendente")
    .in("parcela_id", (parcelas ?? []).map((p) => p.id));

  const comprovantePorParcela = new Map<string, { id: string; nomeArquivo: string | null; urlAssinada: string | null }>();
  for (const c of comprovantesPendentes ?? []) {
    const { data: assinada } = await supabase.storage
      .from("comprovantes-financeiro")
      .createSignedUrl(c.arquivo_path, 600);
    comprovantePorParcela.set(c.parcela_id, {
      id: c.id,
      nomeArquivo: c.nome_arquivo,
      urlAssinada: assinada?.signedUrl ?? null,
    });
  }

  const aluno = contrato.alunos as unknown as { nome: string; telefone: string | null } | null;
  const pagas = (parcelas ?? []).filter((p) => p.status === "paga").length;

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="font-display font-semibold text-3xl">{aluno?.nome ?? "Contrato"}</h1>
          <p className="text-sm text-ink/60 mt-1">
            {LABEL_PLANO[contrato.tipo_plano] ?? contrato.tipo_plano} ·{" "}
            {formatarReais(contrato.valor_parcela_centavos)}/parcela · {pagas}/{contrato.numero_parcelas} pagas
          </p>
        </div>
        {contrato.status === "ativo" && (
          <ConfirmarAcao
            action={cancelarContrato.bind(null, contrato.id)}
            rotulo="Cancelar contrato"
            titulo="Cancelar este contrato?"
            mensagem="Todas as parcelas ainda pendentes serão canceladas. Parcelas já pagas não são afetadas. Essa ação não pode ser desfeita."
          />
        )}
      </div>

      <div className="max-w-2xl space-y-6">
        <section className="bg-white border border-line rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-display font-semibold text-sm">Dados do contrato</h2>
            {contrato.status === "ativo" && (
              <EditarContratoForm
                contratoId={contrato.id}
                valorParcelaCentavosAtual={contrato.valor_parcela_centavos}
                diaVencimentoAtual={contrato.dia_vencimento}
                numeroParcelasAtual={contrato.numero_parcelas}
              />
            )}
          </div>
          <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
            <dt className="text-ink/50">Valor total</dt>
            <dd>{formatarReais(contrato.valor_total_centavos)}</dd>
            <dt className="text-ink/50">Início</dt>
            <dd>{new Date(contrato.data_inicio).toLocaleDateString("pt-BR", { timeZone: "UTC" })}</dd>
            <dt className="text-ink/50">Dia de vencimento</dt>
            <dd>{contrato.dia_vencimento}</dd>
            {contrato.observacoes && (
              <>
                <dt className="text-ink/50">Observações</dt>
                <dd>{contrato.observacoes}</dd>
              </>
            )}
            {contrato.pix_copia_cola && (
              <>
                <dt className="text-ink/50">PIX copia e cola</dt>
                <dd className="break-all">{contrato.pix_copia_cola}</dd>
              </>
            )}
          </dl>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Parcelas</h2>
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
            {(parcelas ?? []).map((p) => {
              const efetivo = statusEfetivo({ status: p.status as any, vencimento: p.vencimento });
              return (
                <li key={p.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">
                        Parcela {p.numero}/{contrato.numero_parcelas} · {formatarReais(p.valor_centavos)}
                      </p>
                      <p className="text-xs text-ink/50">
                        Vence {new Date(p.vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                        {p.status === "paga" && p.data_pagamento && (
                          <>
                            {" "}
                            · Pago em {new Date(p.data_pagamento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                            {p.metodo_pagamento && ` (${p.metodo_pagamento})`}
                          </>
                        )}
                      </p>
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                        efetivo === "paga"
                          ? "bg-good/15 text-good"
                          : efetivo === "atrasada"
                          ? "bg-bad/15 text-bad"
                          : efetivo === "cancelada"
                          ? "bg-ink/10 text-ink/60"
                          : "bg-warn/15 text-warn"
                      }`}
                    >
                      {LABEL_STATUS_PARCELA[efetivo] ?? efetivo}
                    </span>
                  </div>

                  <div className="mt-2">
                    <AcoesParcela
                      parcelaId={p.id}
                      numero={p.numero}
                      valorCentavos={p.valor_centavos}
                      statusEfetivo={efetivo}
                      comprovantePendente={comprovantePorParcela.get(p.id) ?? null}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </main>
  );
}
