import { createClient, getProfile } from "@/lib/supabase/server";
import { statusEfetivo } from "@/lib/financeiro/status";
import EstadoVazio from "@/components/EstadoVazio";
import EnviarComprovanteForm from "./EnviarComprovanteForm";

const LABEL_PLANO: Record<string, string> = {
  mensal: "Mensal",
  semestral: "Semestral",
  anual: "Anual",
};

const LABEL_STATUS: Record<string, string> = {
  pendente: "Pendente",
  paga: "Paga",
  atrasada: "Atrasada",
  cancelada: "Cancelada",
};

function formatarReais(centavos: number): string {
  return (centavos / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default async function AlunoFinanceiroPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id")
    .eq("profile_id", profile?.id)
    .maybeSingle();

  const { data: contrato } = aluno
    ? await supabase
        .from("contratos")
        .select("id, tipo_plano, valor_total_centavos, numero_parcelas, status, pix_copia_cola")
        .eq("aluno_id", aluno.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  const { data: parcelas } = contrato
    ? await supabase
        .from("parcelas")
        .select("id, numero, valor_centavos, vencimento, status")
        .eq("contrato_id", contrato.id)
        .order("numero")
    : { data: [] };

  if (!contrato) {
    return (
      <main className="px-8 py-10">
        <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
          Área do aluno
        </p>
        <h1 className="font-display font-semibold text-3xl mb-8">Financeiro</h1>
        <EstadoVazio texto="Você ainda não tem um contrato ativo. Fale com seu professor." />
      </main>
    );
  }

  const listaParcelas = (parcelas ?? []).map((p) => ({
    ...p,
    efetivo: statusEfetivo({ status: p.status as any, vencimento: p.vencimento }),
  }));

  const pagas = listaParcelas.filter((p) => p.status === "paga");
  const totalPagoCentavos = pagas.reduce((acc, p) => acc + p.valor_centavos, 0);
  const totalFaltaCentavos = contrato.valor_total_centavos - totalPagoCentavos;
  const proximaParcela = listaParcelas.find((p) => p.efetivo === "pendente" || p.efetivo === "atrasada");
  const atrasadas = listaParcelas.filter((p) => p.efetivo === "atrasada");

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Financeiro</h1>

      <div className="max-w-2xl space-y-6">
        <section className="bg-white border border-line rounded-xl p-5">
          <p className="text-sm text-ink/60 mb-3">
            Plano {LABEL_PLANO[contrato.tipo_plano] ?? contrato.tipo_plano} ·{" "}
            {pagas.length}/{contrato.numero_parcelas} parcelas pagas
          </p>

          <div className="w-full h-2 rounded-full bg-line overflow-hidden mb-3">
            <div
              className="h-full bg-accent"
              style={{ width: `${(pagas.length / contrato.numero_parcelas) * 100}%` }}
            />
          </div>

          <dl className="grid grid-cols-2 gap-y-1.5 text-sm">
            <dt className="text-ink/50">Valor total</dt>
            <dd>{formatarReais(contrato.valor_total_centavos)}</dd>
            <dt className="text-ink/50">Já pago</dt>
            <dd className="text-good font-medium">{formatarReais(totalPagoCentavos)}</dd>
            <dt className="text-ink/50">Falta pagar</dt>
            <dd>{formatarReais(Math.max(totalFaltaCentavos, 0))}</dd>
            {contrato.pix_copia_cola && (
              <>
                <dt className="text-ink/50">PIX copia e cola</dt>
                <dd className="break-all">{contrato.pix_copia_cola}</dd>
              </>
            )}
          </dl>
        </section>

        {atrasadas.length > 0 && (
          <section className="bg-bad/10 border border-bad/30 rounded-xl p-4">
            <p className="text-sm font-semibold text-bad mb-1">
              {atrasadas.length} parcela(s) em atraso
            </p>
            <p className="text-xs text-ink/70">
              Fale com seu professor ou envie o comprovante de pagamento abaixo.
            </p>
          </section>
        )}

        {proximaParcela && (
          <section className="bg-accentSoft/40 border border-accent/30 rounded-xl p-4">
            <p className="text-xs text-ink/60 mb-1">Próxima parcela</p>
            <p className="text-sm font-semibold">
              Parcela {proximaParcela.numero}/{contrato.numero_parcelas} ·{" "}
              {formatarReais(proximaParcela.valor_centavos)} · vence{" "}
              {new Date(proximaParcela.vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
            </p>
          </section>
        )}

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Parcelas</h2>
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
            {listaParcelas.map((p) => (
              <li key={p.id} className="px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">
                      Parcela {p.numero}/{contrato.numero_parcelas} · {formatarReais(p.valor_centavos)}
                    </p>
                    <p className="text-xs text-ink/50">
                      Vence {new Date(p.vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                      p.efetivo === "paga"
                        ? "bg-good/15 text-good"
                        : p.efetivo === "atrasada"
                        ? "bg-bad/15 text-bad"
                        : p.efetivo === "cancelada"
                        ? "bg-ink/10 text-ink/60"
                        : "bg-warn/15 text-warn"
                    }`}
                  >
                    {LABEL_STATUS[p.efetivo] ?? p.efetivo}
                  </span>
                </div>

                <div className="mt-2">
                  {p.status === "paga" && (
                    <a
                      href={`/api/financeiro/recibos/${p.id}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-ink/60 hover:underline"
                    >
                      Baixar recibo
                    </a>
                  )}
                  {(p.efetivo === "pendente" || p.efetivo === "atrasada") && (
                    <EnviarComprovanteForm parcelaId={p.id} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
