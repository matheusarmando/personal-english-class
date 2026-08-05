import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import EstadoVazio from "@/components/EstadoVazio";
import { resolverMesReferencia } from "@/lib/calendario";

// Mesmo motivo do professor/page.tsx: sem isso o Next.js pode cachear
// a página e servir sempre o mesmo mês ao trocar ?mes= pelos links de
// navegação abaixo.
export const dynamic = "force-dynamic";

const LABEL_STATUS: Record<string, string> = {
  agendada: "Agendada",
  concluida: "Concluída",
  cancelada: "Cancelada",
};

const CLASSE_STATUS: Record<string, string> = {
  agendada: "bg-line/50 text-ink/60",
  concluida: "bg-good/15 text-good",
  cancelada: "bg-bad/15 text-bad",
};

function mesHref(mesRef: Date, offset: number) {
  const alvo = new Date(Date.UTC(mesRef.getUTCFullYear(), mesRef.getUTCMonth() + offset, 1));
  const valor = `${alvo.getUTCFullYear()}-${String(alvo.getUTCMonth() + 1).padStart(2, "0")}`;
  return `/aluno/frequencia?mes=${valor}`;
}

export default async function AlunoFrequenciaPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const mesRef = resolverMesReferencia(searchParams.mes);
  const inicioMes = new Date(Date.UTC(mesRef.getUTCFullYear(), mesRef.getUTCMonth(), 1));
  const fimMes = new Date(Date.UTC(mesRef.getUTCFullYear(), mesRef.getUTCMonth() + 1, 1));

  const { data: meusRegistros } = await supabase
    .from("alunos")
    .select("id")
    .eq("profile_id", profile?.id);

  const meusRegistroIds = (meusRegistros ?? []).map((a) => a.id);

  const { data: horarios } = meusRegistroIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("id, data_hora, status, conteudo, exercicio")
        .in("aluno_id", meusRegistroIds)
        .gte("data_hora", inicioMes.toISOString())
        .lt("data_hora", fimMes.toISOString())
        .order("data_hora")
    : { data: [] };

  const listaHorarios = horarios ?? [];
  const concluidas = listaHorarios.filter((h) => h.status === "concluida").length;
  const total = listaHorarios.length;
  const taxaPresenca = total > 0 ? Math.round((concluidas / total) * 100) : null;

  const tituloMes = mesRef.toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Frequência</h1>

      <div className="max-w-2xl">
        <div className="flex items-center justify-between mb-4">
          <Link
            href={mesHref(mesRef, -1)}
            prefetch={false}
            className="text-sm text-ink/60 hover:text-accent transition-colors"
          >
            ← Anterior
          </Link>
          <span className="font-display font-semibold text-sm capitalize">{tituloMes}</span>
          <Link
            href={mesHref(mesRef, 1)}
            prefetch={false}
            className="text-sm text-ink/60 hover:text-accent transition-colors"
          >
            Próximo →
          </Link>
        </div>

        <section className="grid grid-cols-3 gap-3 mb-8">
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Aulas no mês</p>
            <p className="font-display font-bold text-2xl mt-1 tabular-nums">{total}</p>
          </div>
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Concluídas</p>
            <p className="font-display font-bold text-2xl mt-1 tabular-nums text-good">{concluidas}</p>
          </div>
          <div className="border border-line rounded-xl p-4 bg-white">
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Frequência</p>
            <p className="font-display font-bold text-2xl mt-1 tabular-nums">
              {taxaPresenca == null ? "—" : `${taxaPresenca}%`}
            </p>
          </div>
        </section>

        {listaHorarios.length === 0 ? (
          <EstadoVazio texto="Nenhuma aula neste período." />
        ) : (
          <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
            {listaHorarios.map((h) => {
              const dt = new Date(h.data_hora);
              return (
                <li key={h.id} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">
                      {dt.toLocaleDateString("pt-BR")} ·{" "}
                      {dt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${CLASSE_STATUS[h.status]}`}
                    >
                      {LABEL_STATUS[h.status]}
                    </span>
                  </div>
                  {h.status === "concluida" && (h.conteudo || h.exercicio) && (
                    <div className="mt-1.5 text-xs text-ink/60 space-y-0.5">
                      {h.conteudo && (
                        <p>
                          <span className="text-ink/40">Conteúdo:</span> {h.conteudo}
                        </p>
                      )}
                      {h.exercicio && (
                        <p>
                          <span className="text-ink/40">Exercício:</span> {h.exercicio}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
