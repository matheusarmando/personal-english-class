import type { SupabaseClient } from "@supabase/supabase-js";

/** Get-or-create — chat é sempre 1:1 por par (professor, aluno). */
export async function obterOuCriarConversa(
  supabase: SupabaseClient,
  professorId: string,
  alunoId: string
): Promise<string | null> {
  const { data: existente } = await supabase
    .from("conversas")
    .select("id")
    .eq("professor_id", professorId)
    .eq("aluno_id", alunoId)
    .maybeSingle();
  if (existente) return existente.id;

  const { data: nova, error } = await supabase
    .from("conversas")
    .insert({ professor_id: professorId, aluno_id: alunoId })
    .select("id")
    .single();

  if (error || !nova) return null;
  return nova.id;
}
