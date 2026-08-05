"use server";

import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export type ResultadoAviso = { ok: true } | { ok: false; erro: string };

export async function publicarAviso(formData: FormData): Promise<ResultadoAviso> {
  const profile = await getProfile();
  if (!profile) return { ok: false, erro: "Não autenticado." };

  const alunoId = (formData.get("aluno_id") as string) || null;
  const titulo = ((formData.get("titulo") as string) || "").trim();
  const conteudo = ((formData.get("conteudo") as string) || "").trim();

  if (!titulo) return { ok: false, erro: "Informe um título." };
  if (!conteudo) return { ok: false, erro: "Informe o conteúdo do aviso." };

  const supabase = createClient();

  let destinatarios: string[];
  if (alunoId) {
    const { data: aluno } = await supabase
      .from("alunos")
      .select("profile_id")
      .eq("id", alunoId)
      .single();
    if (!aluno?.profile_id) {
      return { ok: false, erro: "Esse aluno ainda não tem login na plataforma — avise por outro canal." };
    }
    destinatarios = [aluno.profile_id];
  } else {
    const { data: alunos } = await supabase
      .from("alunos")
      .select("profile_id")
      .eq("professor_id", profile.id)
      .eq("ativo", true)
      .not("profile_id", "is", null);
    destinatarios = (alunos ?? []).map((a) => a.profile_id as string);
    if (destinatarios.length === 0) {
      return { ok: false, erro: "Nenhum aluno ativo com login na plataforma ainda." };
    }
  }

  const envioId = randomUUID();
  const { error } = await supabase.from("notificacoes").insert(
    destinatarios.map((destinatarioId) => ({
      destinatario_id: destinatarioId,
      tipo: "aviso_professor" as const,
      remetente_id: profile.id,
      envio_id: envioId,
      titulo,
      mensagem: conteudo,
    }))
  );

  revalidatePath("/professor/avisos");
  revalidatePath("/aluno");
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
