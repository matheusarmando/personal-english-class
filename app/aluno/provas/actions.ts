"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ResultadoSubmissao = { ok: true; nota: number } | { ok: false; erro: string };

export async function responderProva(
  provaId: string,
  respostas: { questao_id: string; alternativa_id: string }[]
): Promise<ResultadoSubmissao> {
  const supabase = createClient();
  const { data, error } = await supabase.rpc("submeter_prova", {
    p_prova_id: provaId,
    p_respostas: respostas,
  });

  revalidatePath(`/aluno/provas/${provaId}`);
  revalidatePath("/aluno/provas");
  if (error) return { ok: false, erro: error.message };
  return { ok: true, nota: data as number };
}
