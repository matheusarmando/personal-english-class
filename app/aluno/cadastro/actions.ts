"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { telefoneValido } from "@/lib/validacao";

export type ResultadoCadastro = { ok: true } | { ok: false; erro: string };

export async function atualizarMeuCadastro(formData: FormData): Promise<ResultadoCadastro> {
  const nome = formData.get("nome") as string;
  const telefone = formData.get("telefone") as string;
  const dataNascimento = formData.get("data_nascimento") as string;

  if (telefone && !telefoneValido(telefone)) {
    return { ok: false, erro: "Telefone em formato inválido." };
  }

  const supabase = createClient();
  const { error } = await supabase.rpc("atualizar_dados_pessoais_aluno", {
    p_nome: nome,
    p_telefone: telefone || null,
    p_data_nascimento: dataNascimento || null,
  });

  revalidatePath("/aluno/cadastro");

  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
