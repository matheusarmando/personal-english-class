"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient, getProfile } from "@/lib/supabase/server";

function lerDadosAluno(formData: FormData) {
  const valor = formData.get("valor") as string;
  const diaVencimento = formData.get("dia_vencimento") as string;

  return {
    nome: formData.get("nome") as string,
    email: (formData.get("email") as string) || null,
    telefone: (formData.get("telefone") as string) || null,
    data_nascimento: (formData.get("data_nascimento") as string) || null,
    link_aula: (formData.get("link_aula") as string) || null,
    valor: valor ? Number(valor) : null,
    dia_vencimento: diaVencimento ? Number(diaVencimento) : null,
    status_pagamento: (formData.get("status_pagamento") as string) || "pendente",
    ativo: formData.get("ativo") === "on",
    pix_copia_cola: (formData.get("pix_copia_cola") as string) || null,
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

export async function adicionarHorario(alunoId: string, formData: FormData) {
  const supabase = createClient();
  const data = formData.get("data") as string;
  const hora = formData.get("hora") as string;

  if (!data || !hora) return;

  await supabase
    .from("aluno_horarios")
    .insert({ aluno_id: alunoId, data_hora: `${data}T${hora}:00` });

  revalidatePath(`/professor/alunos/${alunoId}`);
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
