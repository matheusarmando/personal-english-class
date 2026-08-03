"use server";

import { createClient } from "@/lib/supabase/server";

export async function solicitarAula(slug: string, formData: FormData) {
  const supabase = createClient();

  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const telefone = formData.get("telefone") as string;
  const mensagem = formData.get("mensagem") as string;

  const { error } = await supabase.rpc("solicitar_aula_publica", {
    p_slug: slug,
    p_nome: nome,
    p_email: email,
    p_telefone: telefone,
    p_mensagem: mensagem,
  });

  if (error) {
    return { ok: false, erro: error.message };
  }

  return { ok: true, erro: null };
}
