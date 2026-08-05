import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { excluirAluno, removerHorario, concluirAula } from "../actions";
import FormAdicionarHorario from "./FormAdicionarHorario";
import EditarAlunoForm from "./EditarAlunoForm";
import ConfirmarAcao from "@/components/ConfirmarAcao";

export default async function AlunoPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id, nome, email, telefone, data_nascimento, link_aula, ativo")
    .eq("id", params.id)
    .single();

  if (!aluno) notFound();

  const { data: horarios } = await supabase
    .from("aluno_horarios")
    .select("id, data_hora, status, conteudo, exercicio")
    .eq("aluno_id", aluno.id)
    .order("data_hora");

  const totalAulas = horarios?.length ?? 0;
  const concluidas = horarios?.filter((h) => h.status === "concluida").length ?? 0;
  const canceladas = horarios?.filter((h) => h.status === "cancelada").length ?? 0;
  const taxaConclusao = totalAulas > 0 ? Math.round((concluidas / totalAulas) * 100) : 0;

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <div className="flex items-baseline justify-between mb-8">
        <h1 className="font-display font-semibold text-3xl">{aluno.nome}</h1>
        <Link
          href={`/professor/financeiro/contratos?aluno=${encodeURIComponent(aluno.nome)}`}
          className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:border-accent transition-colors"
        >
          Ver contratos financeiros
        </Link>
      </div>

      <div className="max-w-2xl space-y-10">
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Relatório</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="border border-line rounded-xl p-4 bg-white">
              <p className="text-[11px] uppercase tracking-wide text-ink/50">Aulas dadas</p>
              <p className="font-display font-bold text-2xl mt-1 tabular-nums">{totalAulas}</p>
            </div>
            <div className="border border-line rounded-xl p-4 bg-white">
              <p className="text-[11px] uppercase tracking-wide text-ink/50">Concluídas</p>
              <p className="font-display font-bold text-2xl mt-1 tabular-nums text-good">{concluidas}</p>
            </div>
            <div className="border border-line rounded-xl p-4 bg-white">
              <p className="text-[11px] uppercase tracking-wide text-ink/50">Canceladas</p>
              <p className="font-display font-bold text-2xl mt-1 tabular-nums text-bad">{canceladas}</p>
            </div>
            <div className="border border-line rounded-xl p-4 bg-white">
              <p className="text-[11px] uppercase tracking-wide text-ink/50">Taxa de conclusão</p>
              <p className="font-display font-bold text-2xl mt-1 tabular-nums">{taxaConclusao}%</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Dados do aluno</h2>
          <EditarAlunoForm aluno={aluno} />

          <div className="mt-3">
            <ConfirmarAcao
              action={excluirAluno.bind(null, aluno.id)}
              rotulo="Excluir aluno"
              titulo="Excluir este aluno?"
              mensagem={`Isso remove ${aluno.nome} e todo o histórico de aulas associado. Essa ação não pode ser desfeita.`}
            />
          </div>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Aulas agendadas</h2>

          {!horarios || horarios.length === 0 ? (
            <p className="text-sm text-ink/60 mb-4">
              Nenhuma aula agendada para este aluno.
            </p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white/60 mb-4">
              {horarios.map((h) => {
                const dt = new Date(h.data_hora);
                const dataHoraFmt = `${dt.toLocaleDateString("pt-BR")} · ${dt.toLocaleTimeString(
                  "pt-BR",
                  { hour: "2-digit", minute: "2-digit" }
                )}`;

                return (
                  <li key={h.id} className="px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm">{dataHoraFmt}</span>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-xs font-semibold px-2 py-1 rounded-full ${
                            h.status === "concluida"
                              ? "bg-good/15 text-good"
                              : h.status === "cancelada"
                              ? "bg-bad/15 text-bad"
                              : "bg-line/50 text-ink/60"
                          }`}
                        >
                          {h.status}
                        </span>
                        <ConfirmarAcao
                          action={removerHorario.bind(null, aluno.id, h.id)}
                          rotulo="Remover"
                          titulo="Remover esta aula?"
                          mensagem={`Remove a aula de ${dataHoraFmt}. Essa ação não pode ser desfeita.`}
                        />
                      </div>
                    </div>

                    {h.status === "concluida" ? (
                      <div className="mt-2 text-xs text-ink/60 space-y-0.5">
                        <p>
                          <span className="text-ink/40">Conteúdo:</span>{" "}
                          {h.conteudo || "—"}
                        </p>
                        <p>
                          <span className="text-ink/40">Exercício:</span>{" "}
                          {h.exercicio || "—"}
                        </p>
                      </div>
                    ) : (
                      <form
                        action={concluirAula.bind(null, aluno.id, h.id)}
                        className="mt-2 flex flex-wrap gap-2"
                      >
                        <input
                          name="conteudo"
                          placeholder="Conteúdo dado"
                          className="flex-1 min-w-[8rem] rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs"
                        />
                        <input
                          name="exercicio"
                          placeholder="Exercício passado"
                          className="flex-1 min-w-[8rem] rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs"
                        />
                        <button
                          type="submit"
                          className="rounded-lg bg-good/15 text-good px-3 py-1.5 text-xs font-semibold hover:bg-good hover:text-white transition-colors"
                        >
                          Marcar como concluída
                        </button>
                      </form>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <FormAdicionarHorario alunoId={aluno.id} linkPadrao={aluno.link_aula} />
        </section>
      </div>
    </main>
  );
}
