"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export async function atualizarMeuCadastro(formData: FormData) {
  const profile = await getProfile();
  if (!profile) return;

  const supabase = createClient();
  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const dataNascimento = formData.get("data_nascimento") as string;

  await supabase
    .from("profiles")
    .update({
      nome,
      telefone: telefone || null,
      data_nascimento: dataNascimento || null,
    })
    .eq("id", profile.id);

  revalidatePath("/professor/cadastro");
}
