"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function criarAula(formData: FormData) {
  const supabase = createClient();
  const turmaId = formData.get("turma_id") as string;
  const titulo = formData.get("titulo") as string;
  const data = formData.get("data") as string;

  await supabase.from("aulas").insert({ turma_id: turmaId, titulo, data });
  revalidatePath("/professor");
}

export async function marcarPresenca(
  aulaId: string,
  alunoId: string,
  presente: boolean
) {
  const supabase = createClient();
  await supabase
    .from("presencas")
    .upsert(
      { aula_id: aulaId, aluno_id: alunoId, presente },
      { onConflict: "aula_id,aluno_id" }
    );
  revalidatePath("/professor");
}
