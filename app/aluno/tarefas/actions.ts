"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export type ResultadoEntrega = { ok: true } | { ok: false; erro: string };

export async function enviarEntrega(tarefaId: string, formData: FormData): Promise<ResultadoEntrega> {
  const profile = await getProfile();
  if (!profile) return { ok: false, erro: "Não autenticado." };

  const texto = ((formData.get("texto_resposta") as string) || "").trim();
  if (!texto) return { ok: false, erro: "Escreva sua resposta antes de enviar." };

  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!aluno) return { ok: false, erro: "Cadastro de aluno não encontrado." };

  const { error } = await supabase.from("tarefa_entregas").insert({
    tarefa_id: tarefaId,
    aluno_id: aluno.id,
    texto_resposta: texto,
  });

  revalidatePath("/aluno/tarefas");
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
