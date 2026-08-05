import { createClient, getProfile } from "@/lib/supabase/server";
import { criarContrato } from "../actions";

export default async function NovoContratoPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  const { data: planos } = await supabase
    .from("planos_config")
    .select("tipo_plano, descricao, numero_parcelas")
    .order("numero_parcelas");

  const hoje = new Date().toISOString().slice(0, 10);

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Novo contrato</h1>

      <form
        action={criarContrato}
        className="max-w-lg grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white border border-line rounded-xl p-6"
      >
        <div className="sm:col-span-2">
          <label className="block text-sm mb-1" htmlFor="aluno_id">
            Aluno <span className="text-bad">*</span>
          </label>
          <select
            id="aluno_id"
            name="aluno_id"
            required
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <option value="">Selecione...</option>
            {(alunos ?? []).map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome}
              </option>
            ))}
          </select>
          {(!alunos || alunos.length === 0) && (
            <p className="text-xs text-warn mt-1">
              Nenhum aluno ativo cadastrado ainda — cadastre um em "Cadastro" antes de criar um contrato.
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="tipo_plano">
            Plano <span className="text-bad">*</span>
          </label>
          <select
            id="tipo_plano"
            name="tipo_plano"
            required
            defaultValue="mensal"
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          >
            {(planos ?? []).map((p) => (
              <option key={p.tipo_plano} value={p.tipo_plano}>
                {p.descricao}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="valor_parcela">
            Valor da parcela (R$) <span className="text-bad">*</span>
          </label>
          <input
            id="valor_parcela"
            name="valor_parcela"
            type="number"
            step="0.01"
            min="0"
            required
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="data_inicio">
            Início do contrato <span className="text-bad">*</span>
          </label>
          <input
            id="data_inicio"
            name="data_inicio"
            type="date"
            required
            defaultValue={hoje}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div>
          <label className="block text-sm mb-1" htmlFor="dia_vencimento">
            Dia de vencimento <span className="text-bad">*</span>
          </label>
          <input
            id="dia_vencimento"
            name="dia_vencimento"
            type="number"
            min="1"
            max="31"
            required
            defaultValue={10}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm mb-1" htmlFor="pix_copia_cola">
            PIX copia e cola
          </label>
          <textarea
            id="pix_copia_cola"
            name="pix_copia_cola"
            rows={2}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm mb-1" htmlFor="observacoes">
            Observações
          </label>
          <textarea
            id="observacoes"
            name="observacoes"
            rows={2}
            className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>

        <p className="sm:col-span-2 text-xs text-ink/50">
          As parcelas são geradas automaticamente a partir do plano escolhido.
        </p>

        <div className="sm:col-span-2">
          <button
            type="submit"
            className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
          >
            Criar contrato
          </button>
        </div>
      </form>
    </main>
  );
}
