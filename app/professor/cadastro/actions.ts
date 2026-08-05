"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";
import { telefoneValido } from "@/lib/validacao";

export type ResultadoCadastro = { ok: true } | { ok: false; erro: string };

export async function atualizarMeuCadastro(formData: FormData): Promise<ResultadoCadastro> {
  const profile = await getProfile();
  if (!profile) return { ok: false, erro: "Não autenticado." };

  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const dataNascimento = formData.get("data_nascimento") as string;

  if (telefone && !telefoneValido(telefone)) {
    return { ok: false, erro: "Telefone em formato inválido." };
  }

  const supabase = createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      nome,
      telefone: telefone || null,
      data_nascimento: dataNascimento || null,
    })
    .eq("id", profile.id);

  revalidatePath("/professor/cadastro");

  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
