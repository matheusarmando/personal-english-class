import { createClient, getProfile } from "@/lib/supabase/server";
import EstadoVazio from "@/components/EstadoVazio";
import EnviarEntregaForm from "./EnviarEntregaForm";

type StatusTarefa = "pendente" | "entregue" | "avaliada";

const LABEL_STATUS: Record<StatusTarefa, string> = {
  pendente: "Pendente",
  entregue: "Entregue",
  avaliada: "Avaliada",
};

const CLASSE_STATUS: Record<StatusTarefa, string> = {
  pendente: "bg-line/50 text-ink/60",
  entregue: "bg-warn/15 text-warn",
  avaliada: "bg-good/15 text-good",
};

const ORDEM_STATUS: Record<StatusTarefa, number> = { pendente: 0, entregue: 1, avaliada: 2 };

function formatarData(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export default async function AlunoTarefasPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id")
    .eq("profile_id", profile?.id)
    .maybeSingle();

  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, titulo, descricao, prazo, pontos, permite_reenvio");

  const { data: entregas } = aluno
    ? await supabase
        .from("tarefa_entregas")
        .select("id, tarefa_id, texto_resposta, nota, feedback_professor")
        .eq("aluno_id", aluno.id)
    : { data: [] };

  const entregaPorTarefa = new Map((entregas ?? []).map((e) => [e.tarefa_id, e]));

  function statusDe(tarefaId: string): StatusTarefa {
    const entrega = entregaPorTarefa.get(tarefaId);
    if (!entrega) return "pendente";
    return entrega.nota !== null ? "avaliada" : "entregue";
  }

  const listaOrdenada = (tarefas ?? [])
    .map((t) => ({ ...t, status: statusDe(t.id), entrega: entregaPorTarefa.get(t.id) }))
    .sort((a, b) => {
      const porStatus = ORDEM_STATUS[a.status] - ORDEM_STATUS[b.status];
      if (porStatus !== 0) return porStatus;
      return a.prazo.localeCompare(b.prazo);
    });

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Tarefas</h1>

      <div className="max-w-2xl">
        {listaOrdenada.length === 0 ? (
          <EstadoVazio texto="Nenhuma tarefa atribuída ainda." />
        ) : (
          <ul className="space-y-3">
            {listaOrdenada.map((t) => (
              <li key={t.id} className="border border-line rounded-xl bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{t.titulo}</p>
                    <p className="text-xs text-ink/50 mt-0.5">
                      Prazo: {formatarData(t.prazo)}
                      {t.pontos ? ` · ${t.pontos} pts` : ""}
                    </p>
                    {t.descricao && <p className="text-xs text-ink/60 mt-1">{t.descricao}</p>}
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${CLASSE_STATUS[t.status]}`}
                  >
                    {LABEL_STATUS[t.status]}
                  </span>
                </div>

                {t.status === "pendente" && <EnviarEntregaForm tarefaId={t.id} />}

                {t.entrega && t.status !== "pendente" && (
                  <div className="mt-2 text-xs text-ink/60 space-y-1">
                    <p className="whitespace-pre-wrap">
                      <span className="text-ink/40">Sua resposta:</span> {t.entrega.texto_resposta}
                    </p>
                    {t.status === "avaliada" && (
                      <p>
                        <span className="text-ink/40">Nota:</span> {t.entrega.nota}
                        {t.entrega.feedback_professor
                          ? ` · ${t.entrega.feedback_professor}`
                          : ""}
                      </p>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
