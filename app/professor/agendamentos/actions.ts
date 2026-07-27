"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export async function criarAgendamentoAvulso(formData: FormData) {
  const profile = await getProfile();
  if (!profile) return;

  const supabase = createClient();
  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const telefone = formData.get("telefone") as string;
  const tipo = formData.get("tipo") as string;
  const data = formData.get("data") as string;
  const hora = formData.get("hora") as string;
  const observacoes = formData.get("observacoes") as string;

  if (!data || !hora) return;

  await supabase.from("agendamentos_avulsos").insert({
    professor_id: profile.id,
    nome,
    email: email || null,
    telefone: telefone || null,
    tipo: tipo || "outro",
    data_hora: `${data}T${hora}:00`,
    observacoes: observacoes || null,
  });

  revalidatePath("/professor/agendamentos");
  revalidatePath("/professor");
}

export async function excluirAgendamentoAvulso(agendamentoId: string) {
  const supabase = createClient();
  await supabase.from("agendamentos_avulsos").delete().eq("id", agendamentoId);
  revalidatePath("/professor/agendamentos");
  revalidatePath("/professor");
}
