"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export type ResultadoTarefa = { ok: true } | { ok: false; erro: string };

export async function criarTarefa(formData: FormData): Promise<ResultadoTarefa> {
  const profile = await getProfile();
  if (!profile) return { ok: false, erro: "Não autenticado." };

  const alunoId = (formData.get("aluno_id") as string) || null;
  const titulo = (formData.get("titulo") as string) || "";
  const descricao = (formData.get("descricao") as string) || null;
  const prazo = formData.get("prazo") as string;
  const pontos = Number(formData.get("pontos")) || 0;
  const permiteReenvio = formData.get("permite_reenvio") === "on";

  if (!titulo.trim()) return { ok: false, erro: "Informe um título." };
  if (!prazo) return { ok: false, erro: "Informe o prazo." };

  const supabase = createClient();
  const { error } = await supabase.from("tarefas").insert({
    professor_id: profile.id,
    aluno_id: alunoId || null,
    titulo: titulo.trim(),
    descricao,
    prazo,
    pontos,
    permite_reenvio: permiteReenvio,
  });

  revalidatePath("/professor/tarefas");
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}

export async function excluirTarefa(tarefaId: string) {
  const supabase = createClient();
  await supabase.from("tarefas").delete().eq("id", tarefaId);
  revalidatePath("/professor/tarefas");
}

export async function avaliarEntrega(
  entregaId: string,
  formData: FormData
): Promise<ResultadoTarefa> {
  const nota = formData.get("nota") === "" ? null : Number(formData.get("nota"));
  const feedback = (formData.get("feedback") as string) || null;

  if (nota !== null && (Number.isNaN(nota) || nota < 0)) {
    return { ok: false, erro: "Nota inválida." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("tarefa_entregas")
    .update({
      nota,
      feedback_professor: feedback,
      avaliado_em: new Date().toISOString(),
    })
    .eq("id", entregaId);

  revalidatePath("/professor/tarefas");
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
