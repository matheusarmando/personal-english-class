"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";
import { GoogleCalendarProvider } from "@/lib/google-calendar/providers/google";
import { converterParaInstanteUTC } from "@/lib/google-calendar/timezone";

export type ResultadoAgendamento =
  | { ok: true }
  | { ok: false; conflito: true; tituloConflito: string | null; inicioConflito: string; fimConflito: string }
  | { ok: false; conflito: false; erro: string };

function lerDadosAluno(formData: FormData) {
  return {
    nome: formData.get("nome") as string,
    email: (formData.get("email") as string) || null,
    telefone: (formData.get("telefone") as string) || null,
    data_nascimento: (formData.get("data_nascimento") as string) || null,
    link_aula: (formData.get("link_aula") as string) || null,
    ativo: formData.get("ativo") === "on",
  };
}

export async function criarAluno(formData: FormData) {
  const profile = await getProfile();
  if (!profile) return;

  const supabase = createClient();

  await supabase.from("alunos").insert({
    professor_id: profile.id,
    ...lerDadosAluno(formData),
  });

  revalidatePath("/professor/alunos");
}

export async function atualizarAluno(alunoId: string, formData: FormData) {
  const supabase = createClient();

  await supabase.from("alunos").update(lerDadosAluno(formData)).eq("id", alunoId);

  revalidatePath("/professor/alunos");
  revalidatePath(`/professor/alunos/${alunoId}`);
}

export async function excluirAluno(alunoId: string) {
  const supabase = createClient();
  await supabase.from("alunos").delete().eq("id", alunoId);
  revalidatePath("/professor/alunos");
  redirect("/professor/alunos");
}

const DURACAO_PADRAO_MINUTOS = 60;

export async function adicionarHorario(alunoId: string, formData: FormData): Promise<ResultadoAgendamento> {
  const supabase = createClient();
  const data = formData.get("data") as string;
  const hora = formData.get("hora") as string;
  const forcarAgendamento = formData.get("forcar_agendamento") === "on";

  if (!data || !hora) return { ok: false, conflito: false, erro: "Preencha data e hora." };

  const { data: aluno } = await supabase.from("alunos").select("professor_id").eq("id", alunoId).single();
  if (!aluno) return { ok: false, conflito: false, erro: "Aluno não encontrado." };

  const { data: professor } = await supabase
    .from("profiles")
    .select("timezone")
    .eq("id", aluno.professor_id)
    .single();

  const inicio = converterParaInstanteUTC(data, hora, professor?.timezone ?? "America/Sao_Paulo");
  const fim = new Date(inicio.getTime() + DURACAO_PADRAO_MINUTOS * 60 * 1000);

  if (!forcarAgendamento) {
    const provider = new GoogleCalendarProvider(supabase);
    const { conflito } = await provider.verificarOcupacao(aluno.professor_id, inicio, fim);
    if (conflito) {
      return {
        ok: false,
        conflito: true,
        tituloConflito: conflito.titulo,
        inicioConflito: conflito.inicio.toISOString(),
        fimConflito: conflito.fim.toISOString(),
      };
    }
  }

  await supabase.from("aluno_horarios").insert({ aluno_id: alunoId, data_hora: inicio.toISOString() });

  revalidatePath(`/professor/alunos/${alunoId}`);
  return { ok: true };
}

export async function removerHorario(alunoId: string, horarioId: string) {
  const supabase = createClient();
  await supabase.from("aluno_horarios").delete().eq("id", horarioId);
  revalidatePath(`/professor/alunos/${alunoId}`);
}

export async function concluirAula(
  alunoId: string,
  horarioId: string,
  formData: FormData
) {
  const supabase = createClient();
  const conteudo = formData.get("conteudo") as string;
  const exercicio = formData.get("exercicio") as string;

  await supabase
    .from("aluno_horarios")
    .update({
      status: "concluida",
      conteudo: conteudo || null,
      exercicio: exercicio || null,
    })
    .eq("id", horarioId);

  revalidatePath(`/professor/alunos/${alunoId}`);
  revalidatePath("/professor");
}
