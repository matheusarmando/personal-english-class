import { createClient, getProfile } from "@/lib/supabase/server";
import ConfirmarAcao from "@/components/ConfirmarAcao";
import EstadoVazio from "@/components/EstadoVazio";
import NovaTarefaForm from "./NovaTarefaForm";
import AvaliarEntregaForm from "./AvaliarEntregaForm";
import { excluirTarefa } from "./actions";

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

function formatarData(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("pt-BR");
}

export default async function TarefasPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  const alunosAtivos = alunos ?? [];
  const nomePorAlunoId = new Map(alunosAtivos.map((a) => [a.id, a.nome]));

  const { data: tarefas } = await supabase
    .from("tarefas")
    .select("id, aluno_id, titulo, descricao, prazo, pontos, permite_reenvio")
    .eq("professor_id", profile?.id)
    .order("prazo");

  const listaTarefas = tarefas ?? [];
  const tarefaIds = listaTarefas.map((t) => t.id);

  const { data: entregas } = tarefaIds.length
    ? await supabase
        .from("tarefa_entregas")
        .select("id, tarefa_id, aluno_id, texto_resposta, nota, feedback_professor, enviado_em")
        .in("tarefa_id", tarefaIds)
    : { data: [] };

  const listaEntregas = entregas ?? [];
  const entregaPorTarefaEAluno = new Map(
    listaEntregas.map((e) => [`${e.tarefa_id}:${e.aluno_id}`, e])
  );

  function statusDe(entrega: (typeof listaEntregas)[number] | undefined): StatusTarefa {
    if (!entrega) return "pendente";
    return entrega.nota !== null ? "avaliada" : "entregue";
  }

  let pendentes = 0;
  let entregues = 0;
  let avaliadas = 0;

  for (const t of listaTarefas) {
    const alvos = t.aluno_id ? [t.aluno_id] : alunosAtivos.map((a) => a.id);
    for (const alunoId of alvos) {
      const status = statusDe(entregaPorTarefaEAluno.get(`${t.id}:${alunoId}`));
      if (status === "pendente") pendentes++;
      else if (status === "entregue") entregues++;
      else avaliadas++;
    }
  }

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Tarefas</h1>

      {alunosAtivos.length === 0 ? (
        <p className="text-sm text-ink/60 max-w-xl">
          Cadastre pelo menos um aluno ativo em{" "}
          <span className="font-medium">Alunos</span> pra poder atribuir
          tarefas.
        </p>
      ) : (
        <div className="max-w-3xl space-y-8">
          <section className="grid grid-cols-3 gap-3 max-w-md">
            <div className="border border-line rounded-xl p-3 bg-white">
              <p className="text-[11px] uppercase tracking-wide text-ink/50">Pendentes</p>
              <p className="font-display font-bold text-2xl mt-1 tabular-nums">{pendentes}</p>
            </div>
            <div className="border border-line rounded-xl p-3 bg-white">
              <p className="text-[11px] uppercase tracking-wide text-ink/50">Entregues</p>
              <p className="font-display font-bold text-2xl mt-1 tabular-nums text-warn">{entregues}</p>
            </div>
            <div className="border border-line rounded-xl p-3 bg-white">
              <p className="text-[11px] uppercase tracking-wide text-ink/50">Avaliadas</p>
              <p className="font-display font-bold text-2xl mt-1 tabular-nums text-good">{avaliadas}</p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-3">Nova tarefa</h2>
            <NovaTarefaForm alunos={alunosAtivos} />
          </section>

          <section>
            <h2 className="font-display font-semibold text-lg mb-3">Todas as tarefas</h2>
            {listaTarefas.length === 0 ? (
              <EstadoVazio texto="Nenhuma tarefa criada ainda." />
            ) : (
              <ul className="space-y-3">
                {listaTarefas.map((t) => {
                  const alvos = t.aluno_id
                    ? [{ id: t.aluno_id, nome: nomePorAlunoId.get(t.aluno_id) ?? "Aluno" }]
                    : alunosAtivos;

                  return (
                    <li key={t.id} className="border border-line rounded-xl bg-white p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{t.titulo}</p>
                          <p className="text-xs text-ink/50 mt-0.5">
                            {t.aluno_id ? nomePorAlunoId.get(t.aluno_id) ?? "Aluno" : "Geral"} · Prazo:{" "}
                            {formatarData(t.prazo)}
                            {t.pontos ? ` · ${t.pontos} pts` : ""}
                            {t.permite_reenvio ? " · Permite reenvio" : ""}
                          </p>
                          {t.descricao && (
                            <p className="text-xs text-ink/60 mt-1">{t.descricao}</p>
                          )}
                        </div>
                        <ConfirmarAcao
                          action={excluirTarefa.bind(null, t.id)}
                          rotulo="Excluir"
                          titulo="Excluir esta tarefa?"
                          mensagem={`Remove "${t.titulo}" e todas as entregas associadas. Essa ação não pode ser desfeita.`}
                        />
                      </div>

                      <ul className="mt-3 divide-y divide-line border-t border-line">
                        {alvos.map((aluno) => {
                          const entrega = entregaPorTarefaEAluno.get(`${t.id}:${aluno.id}`);
                          const status = statusDe(entrega);
                          return (
                            <li key={aluno.id} className="py-2">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-xs font-medium">{aluno.nome}</span>
                                <span
                                  className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${CLASSE_STATUS[status]}`}
                                >
                                  {LABEL_STATUS[status]}
                                </span>
                              </div>
                              {entrega?.texto_resposta && (
                                <p className="text-xs text-ink/60 mt-1 whitespace-pre-wrap">
                                  {entrega.texto_resposta}
                                </p>
                              )}
                              {entrega && (
                                <AvaliarEntregaForm
                                  entregaId={entrega.id}
                                  notaAtual={entrega.nota}
                                  feedbackAtual={entrega.feedback_professor}
                                />
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
