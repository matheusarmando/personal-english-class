import { notFound } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import EstadoVazio from "@/components/EstadoVazio";
import ResponderProvaForm from "./ResponderProvaForm";

type ItemProva = {
  questao_id: string;
  enunciado: string;
  questao_ordem: number;
  pontos: number;
  alternativa_id: string;
  alternativa_texto: string;
  alternativa_ordem: number;
};

export default async function AlunoProvaPage({ params }: { params: { id: string } }) {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id")
    .eq("profile_id", profile?.id)
    .maybeSingle();

  const { data: prova } = await supabase
    .from("provas")
    .select("id, titulo, descricao")
    .eq("id", params.id)
    .maybeSingle();

  if (!prova || !aluno) notFound();

  const { data: atribuicao } = await supabase
    .from("prova_atribuicoes")
    .select("nota, respondido_em")
    .eq("prova_id", prova.id)
    .eq("aluno_id", aluno.id)
    .maybeSingle();

  if (!atribuicao) notFound();

  if (atribuicao.respondido_em) {
    return (
      <main className="px-8 py-10">
        <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
          Área do aluno
        </p>
        <h1 className="font-display font-semibold text-3xl mb-8">{prova.titulo}</h1>
        <div className="max-w-xl border border-line rounded-xl bg-white p-8 text-center">
          <p className="text-sm font-semibold mb-1">Prova respondida</p>
          <p className="text-2xl font-display font-bold text-good">{atribuicao.nota} pontos</p>
        </div>
      </main>
    );
  }

  const { data: itens, error } = await supabase.rpc("prova_para_responder", {
    p_prova_id: prova.id,
  });

  if (error || !itens || itens.length === 0) {
    return (
      <main className="px-8 py-10">
        <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
          Área do aluno
        </p>
        <h1 className="font-display font-semibold text-3xl mb-8">{prova.titulo}</h1>
        <EstadoVazio texto="Esta prova ainda não tem questões." />
      </main>
    );
  }

  const questoesMap = new Map<
    string,
    { id: string; enunciado: string; pontos: number; alternativas: { id: string; texto: string }[] }
  >();
  for (const item of itens as ItemProva[]) {
    const q = questoesMap.get(item.questao_id) ?? {
      id: item.questao_id,
      enunciado: item.enunciado,
      pontos: item.pontos,
      alternativas: [],
    };
    q.alternativas.push({ id: item.alternativa_id, texto: item.alternativa_texto });
    questoesMap.set(item.questao_id, q);
  }
  const questoes = [...questoesMap.values()];

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <h1 className="font-display font-semibold text-3xl mb-2">{prova.titulo}</h1>
      {prova.descricao && <p className="text-sm text-ink/60 mb-8">{prova.descricao}</p>}

      <ResponderProvaForm provaId={prova.id} questoes={questoes} />
    </main>
  );
}
