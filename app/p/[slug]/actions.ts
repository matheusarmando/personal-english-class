"use server";

import { createClient } from "@/lib/supabase/server";
import { emailValido, telefoneValido } from "@/lib/validacao";

export async function solicitarAula(slug: string, formData: FormData) {
  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const telefone = formData.get("telefone") as string;
  const mensagem = formData.get("mensagem") as string;

  // Rota 100% anônima e pública — validar aqui também, não só na RPC
  // (0024_validacao_backend_email_telefone.sql), pra dar feedback
  // imediato em vez de um erro genérico de banco.
  if (email && !emailValido(email)) {
    return { ok: false, erro: "E-mail em formato inválido." };
  }
  if (telefone && !telefoneValido(telefone)) {
    return { ok: false, erro: "Telefone em formato inválido." };
  }

  const supabase = createClient();

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
