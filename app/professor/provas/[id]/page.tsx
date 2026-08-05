import { notFound } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import ConfirmarAcao from "@/components/ConfirmarAcao";
import EstadoVazio from "@/components/EstadoVazio";
import { excluirProva, removerAtribuicao } from "../actions";
import NovaQuestaoForm from "./NovaQuestaoForm";
import AtribuirAlunosForm from "./AtribuirAlunosForm";
import PublicarProvaButton from "./PublicarProvaButton";

const LABEL_STATUS: Record<string, string> = {
  rascunho: "Rascunho",
  publicada: "Publicada",
  encerrada: "Encerrada",
};

const CLASSE_STATUS: Record<string, string> = {
  rascunho: "bg-line/50 text-ink/60",
  publicada: "bg-good/15 text-good",
  encerrada: "bg-ink/10 text-ink/50",
};

export default async function ProvaDetalhePage({ params }: { params: { id: string } }) {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: prova } = await supabase
    .from("provas")
    .select("id, titulo, descricao, data_aplicacao, status")
    .eq("id", params.id)
    .eq("professor_id", profile?.id)
    .maybeSingle();

  if (!prova) notFound();

  const { data: questoes } = await supabase
    .from("prova_questoes")
    .select("id, enunciado, ordem, pontos")
    .eq("prova_id", prova.id)
    .order("ordem");

  const listaQuestoes = questoes ?? [];
  const questaoIds = listaQuestoes.map((q) => q.id);
  const pontosTotais = listaQuestoes.reduce((acc, q) => acc + q.pontos, 0);

  const { data: alternativas } = questaoIds.length
    ? await supabase
        .from("prova_alternativas")
        .select("id, questao_id, texto, correta, ordem")
        .in("questao_id", questaoIds)
        .order("ordem")
    : { data: [] };

  const alternativasPorQuestao = new Map<string, typeof alternativas>();
  for (const alt of alternativas ?? []) {
    const lista = alternativasPorQuestao.get(alt.questao_id) ?? [];
    lista.push(alt);
    alternativasPorQuestao.set(alt.questao_id, lista);
  }

  const { data: atribuicoes } = await supabase
    .from("prova_atribuicoes")
    .select("id, aluno_id, nota, respondido_em")
    .eq("prova_id", prova.id);

  const listaAtribuicoes = atribuicoes ?? [];
  const alunoIdsAtribuidos = new Set(listaAtribuicoes.map((a) => a.aluno_id));

  const { data: alunosAtivos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  const nomePorAlunoId = new Map((alunosAtivos ?? []).map((a) => [a.id, a.nome]));
  const alunosDisponiveis = (alunosAtivos ?? []).filter((a) => !alunoIdsAtribuidos.has(a.id));

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <div className="flex items-start justify-between gap-3 mb-8 max-w-2xl">
        <div>
          <h1 className="font-display font-semibold text-3xl">{prova.titulo}</h1>
          {prova.descricao && <p className="text-sm text-ink/60 mt-1">{prova.descricao}</p>}
          {prova.data_aplicacao && (
            <p className="text-xs text-ink/50 mt-1">
              Aplicação: {new Date(prova.data_aplicacao + "T00:00:00").toLocaleDateString("pt-BR")}
            </p>
          )}
        </div>
        <span
          className={`text-xs font-semibold px-2 py-1 rounded-full shrink-0 ${CLASSE_STATUS[prova.status]}`}
        >
          {LABEL_STATUS[prova.status]}
        </span>
      </div>

      <div className="max-w-2xl space-y-8">
        <section className="flex items-center gap-3">
          {prova.status === "rascunho" && <PublicarProvaButton provaId={prova.id} />}
          <ConfirmarAcao
            action={excluirProva.bind(null, prova.id)}
            rotulo="Excluir prova"
            titulo="Excluir esta prova?"
            mensagem={`Remove "${prova.titulo}", suas questões e respostas. Essa ação não pode ser desfeita.`}
          />
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">
            Questões {pontosTotais > 0 && <span className="text-ink/50 font-normal">· {pontosTotais} pts no total</span>}
          </h2>

          {listaQuestoes.length === 0 ? (
            <EstadoVazio texto="Nenhuma questão adicionada ainda." />
          ) : (
            <ul className="space-y-3 mb-4">
              {listaQuestoes.map((q, i) => (
                <li key={q.id} className="border border-line rounded-xl bg-white p-4">
                  <p className="text-sm font-medium">
                    {i + 1}. {q.enunciado}{" "}
                    <span className="text-xs text-ink/50 font-normal">· {q.pontos} pts</span>
                  </p>
                  <ul className="mt-2 space-y-1">
                    {(alternativasPorQuestao.get(q.id) ?? []).map((alt) => (
                      <li
                        key={alt.id}
                        className={`text-sm px-2 py-1 rounded ${
                          alt.correta ? "bg-good/15 text-good font-medium" : "text-ink/60"
                        }`}
                      >
                        {alt.correta ? "✓ " : ""}
                        {alt.texto}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}

          {prova.status === "rascunho" && (
            <NovaQuestaoForm provaId={prova.id} proximaOrdem={listaQuestoes.length} />
          )}
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Alunos atribuídos</h2>

          {listaAtribuicoes.length === 0 ? (
            <EstadoVazio texto="Nenhum aluno atribuído ainda." />
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white mb-4">
              {listaAtribuicoes.map((a) => (
                <li key={a.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{nomePorAlunoId.get(a.aluno_id) ?? "Aluno"}</p>
                    <p className="text-xs text-ink/50">
                      {a.respondido_em
                        ? `Nota: ${a.nota}/${pontosTotais}`
                        : "Ainda não respondeu"}
                    </p>
                  </div>
                  <ConfirmarAcao
                    action={removerAtribuicao.bind(null, a.id, prova.id)}
                    rotulo="Remover"
                    titulo="Remover esta atribuição?"
                    mensagem={`${nomePorAlunoId.get(a.aluno_id) ?? "Este aluno"} deixará de ver esta prova.`}
                  />
                </li>
              ))}
            </ul>
          )}

          <AtribuirAlunosForm provaId={prova.id} alunosDisponiveis={alunosDisponiveis} />
        </section>
      </div>
    </main>
  );
}
