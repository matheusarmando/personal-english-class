import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import EstadoVazio from "@/components/EstadoVazio";

const LABEL_PLANO: Record<string, string> = {
  mensal: "Mensal",
  bimestral: "Bimestral",
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
};

const LABEL_STATUS: Record<string, string> = {
  ativo: "Ativo",
  concluido: "Concluído",
  cancelado: "Cancelado",
};

export default async function ContratosPage({
  searchParams,
}: {
  searchParams: { aluno?: string; plano?: string; status?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  let query = supabase
    .from("contratos")
    .select("id, tipo_plano, valor_parcela_centavos, numero_parcelas, status, alunos(nome)")
    .eq("professor_id", profile?.id);

  if (searchParams.plano) query = query.eq("tipo_plano", searchParams.plano);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  const { data: contratos } = await query.order("created_at", { ascending: false });
  const { data: planos } = await supabase
    .from("planos_config")
    .select("tipo_plano, descricao")
    .order("numero_parcelas");

  const contratosFiltrados = searchParams.aluno
    ? (contratos ?? []).filter((c: any) =>
        c.alunos?.nome?.toLowerCase().includes(searchParams.aluno!.toLowerCase())
      )
    : contratos ?? [];

  const contratoIds = contratosFiltrados.map((c) => c.id);
  const { data: parcelas } = contratoIds.length
    ? await supabase.from("parcelas").select("contrato_id, status").in("contrato_id", contratoIds)
    : { data: [] };

  const pagasPorContrato = new Map<string, number>();
  for (const p of parcelas ?? []) {
    if (p.status === "paga") {
      pagasPorContrato.set(p.contrato_id, (pagasPorContrato.get(p.contrato_id) ?? 0) + 1);
    }
  }

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
            Área do professor
          </p>
          <h1 className="font-display font-semibold text-3xl">Contratos</h1>
        </div>
        <Link
          href="/professor/financeiro/contratos/novo"
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
        >
          Novo contrato
        </Link>
      </div>

      <form
        method="get"
        className="flex flex-wrap gap-2 mb-4 bg-white border border-line rounded-xl p-3 max-w-2xl"
      >
        <input
          type="search"
          name="aluno"
          placeholder="Buscar por aluno..."
          defaultValue={searchParams.aluno ?? ""}
          className="flex-1 min-w-[10rem] rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <select
          name="plano"
          defaultValue={searchParams.plano ?? ""}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Todos os planos</option>
          {(planos ?? []).map((p) => (
            <option key={p.tipo_plano} value={p.tipo_plano}>
              {LABEL_PLANO[p.tipo_plano] ?? p.tipo_plano}
            </option>
          ))}
        </select>
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="">Todos os status</option>
          <option value="ativo">Ativo</option>
          <option value="concluido">Concluído</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button
          type="submit"
          className="rounded-lg border border-line px-3 py-1.5 text-sm font-semibold hover:border-accent transition-colors"
        >
          Filtrar
        </button>
      </form>

      <div className="max-w-2xl border border-line rounded-xl bg-white overflow-hidden">
        {contratosFiltrados.length === 0 ? (
          <EstadoVazio texto="Nenhum contrato encontrado." />
        ) : (
          <ul className="divide-y divide-line">
            {contratosFiltrados.map((c: any) => (
              <li key={c.id}>
                <Link
                  href={`/professor/financeiro/contratos/${c.id}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-paper transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{c.alunos?.nome ?? "—"}</p>
                    <p className="text-xs text-ink/50">
                      {LABEL_PLANO[c.tipo_plano] ?? c.tipo_plano} ·{" "}
                      {(pagasPorContrato.get(c.id) ?? 0)}/{c.numero_parcelas} parcelas pagas
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                      c.status === "ativo"
                        ? "bg-good/15 text-good"
                        : c.status === "cancelado"
                        ? "bg-bad/15 text-bad"
                        : "bg-ink/10 text-ink/60"
                    }`}
                  >
                    {LABEL_STATUS[c.status] ?? c.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
