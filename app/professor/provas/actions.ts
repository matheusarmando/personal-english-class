"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export type ResultadoProva = { ok: true } | { ok: false; erro: string };

export async function criarProva(formData: FormData): Promise<ResultadoProva> {
  const profile = await getProfile();
  if (!profile) return { ok: false, erro: "Não autenticado." };

  const titulo = ((formData.get("titulo") as string) || "").trim();
  const descricao = ((formData.get("descricao") as string) || "").trim() || null;
  const dataAplicacao = (formData.get("data_aplicacao") as string) || null;

  if (!titulo) return { ok: false, erro: "Informe um título." };

  const supabase = createClient();
  const { data, error } = await supabase
    .from("provas")
    .insert({ professor_id: profile.id, titulo, descricao, data_aplicacao: dataAplicacao })
    .select("id")
    .single();

  if (error || !data) return { ok: false, erro: error?.message ?? "Erro ao criar prova." };

  revalidatePath("/professor/provas");
  redirect(`/professor/provas/${data.id}`);
}

export async function excluirProva(provaId: string) {
  const supabase = createClient();
  await supabase.from("provas").delete().eq("id", provaId);
  revalidatePath("/professor/provas");
  redirect("/professor/provas");
}

export type ResultadoQuestao = { ok: true } | { ok: false; erro: string };

export async function adicionarQuestao(provaId: string, formData: FormData): Promise<ResultadoQuestao> {
  const enunciado = ((formData.get("enunciado") as string) || "").trim();
  const pontos = Number(formData.get("pontos")) || 1;
  const ordem = Number(formData.get("ordem")) || 0;
  const alternativasTexto = (formData.getAll("alternativa_texto") as string[]).map((t) => t.trim());
  const corretaIndex = Number(formData.get("correta_index"));

  if (!enunciado) return { ok: false, erro: "Informe o enunciado." };
  if (alternativasTexto.length < 2 || alternativasTexto.some((t) => !t)) {
    return { ok: false, erro: "Preencha ao menos duas alternativas." };
  }
  if (Number.isNaN(corretaIndex) || !alternativasTexto[corretaIndex]) {
    return { ok: false, erro: "Marque qual alternativa é a correta." };
  }

  const alternativas = alternativasTexto.map((texto, i) => ({
    texto,
    correta: i === corretaIndex,
    ordem: i,
  }));

  const supabase = createClient();
  const { error } = await supabase.rpc("adicionar_questao_prova", {
    p_prova_id: provaId,
    p_enunciado: enunciado,
    p_pontos: pontos,
    p_ordem: ordem,
    p_alternativas: alternativas,
  });

  revalidatePath(`/professor/provas/${provaId}`);
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function atribuirAlunos(provaId: string, formData: FormData): Promise<ResultadoProva> {
  const alunoIds = formData.getAll("aluno_id") as string[];
  if (alunoIds.length === 0) return { ok: false, erro: "Selecione ao menos um aluno." };

  const supabase = createClient();
  const { error } = await supabase
    .from("prova_atribuicoes")
    .upsert(
      alunoIds.map((alunoId) => ({ prova_id: provaId, aluno_id: alunoId })),
      { onConflict: "prova_id,aluno_id", ignoreDuplicates: true }
    );

  revalidatePath(`/professor/provas/${provaId}`);
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function removerAtribuicao(atribuicaoId: string, provaId: string) {
  const supabase = createClient();
  await supabase.from("prova_atribuicoes").delete().eq("id", atribuicaoId);
  revalidatePath(`/professor/provas/${provaId}`);
}

export async function publicarProva(provaId: string): Promise<ResultadoProva> {
  const supabase = createClient();
  const { error } = await supabase.rpc("publicar_prova", { p_prova_id: provaId });

  revalidatePath(`/professor/provas/${provaId}`);
  revalidatePath("/professor/provas");
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
