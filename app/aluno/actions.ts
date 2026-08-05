"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";
import { converterParaInstanteUTC } from "@/lib/google-calendar/timezone";

export type ResultadoSolicitacao = { ok: true } | { ok: false; erro: string };

export async function solicitarAgendamento(formData: FormData): Promise<ResultadoSolicitacao> {
  const profile = await getProfile();
  if (!profile) return { ok: false, erro: "Não autenticado." };

  const alunoHorarioId = formData.get("aula_horario_id") as string;
  const tipo = formData.get("tipo") as string;
  const motivo = ((formData.get("motivo") as string) || "").trim();
  const data = (formData.get("data") as string) || "";
  const hora = (formData.get("hora") as string) || "";

  if (!alunoHorarioId || (tipo !== "remarcacao" && tipo !== "cancelamento")) {
    return { ok: false, erro: "Dados inválidos." };
  }
  if (tipo === "remarcacao" && (!data || !hora)) {
    return { ok: false, erro: "Informe a data e o horário sugeridos." };
  }

  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id, professor_id")
    .eq("profile_id", profile.id)
    .maybeSingle();
  if (!aluno) return { ok: false, erro: "Cadastro de aluno não encontrado." };

  let dataHoraSugerida: string | null = null;
  if (tipo === "remarcacao") {
    const { data: professor } = await supabase
      .from("profiles")
      .select("timezone")
      .eq("id", aluno.professor_id)
      .single();
    dataHoraSugerida = converterParaInstanteUTC(
      data,
      hora,
      professor?.timezone ?? "America/Sao_Paulo"
    ).toISOString();
  }

  const { error } = await supabase.from("solicitacoes_agendamento").insert({
    aluno_id: aluno.id,
    professor_id: aluno.professor_id,
    tipo,
    aula_horario_id: alunoHorarioId,
    data_hora_sugerida: dataHoraSugerida,
    motivo: motivo || null,
  });

  revalidatePath("/aluno");
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
