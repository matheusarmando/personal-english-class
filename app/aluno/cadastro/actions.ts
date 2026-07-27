"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function atualizarMeuCadastro(formData: FormData) {
  const supabase = createClient();

  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const dataNascimento = formData.get("data_nascimento") as string;

  await supabase.rpc("atualizar_dados_pessoais_aluno", {
    p_nome: nome,
    p_telefone: telefone || null,
    p_data_nascimento: dataNascimento || null,
  });

  revalidatePath("/aluno/cadastro");
}
