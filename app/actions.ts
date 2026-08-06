"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export async function sair() {
  const supabase = createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function marcarNotificacaoComoLida(id: string) {
  const supabase = createClient();
  await supabase
    .from("notificacoes")
    .update({ lida: true, lida_em: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/professor");
  revalidatePath("/aluno");
  revalidatePath("/gestao");
}

export async function marcarTodasNotificacoesComoLidas() {
  const profile = await getProfile();
  if (!profile) return;

  const supabase = createClient();
  await supabase
    .from("notificacoes")
    .update({ lida: true, lida_em: new Date().toISOString() })
    .eq("destinatario_id", profile.id)
    .eq("lida", false);

  revalidatePath("/professor");
  revalidatePath("/aluno");
  revalidatePath("/gestao");
}

export type ResultadoMensagem = { ok: true } | { ok: false; erro: string };

/** Compartilhada entre professor e aluno — RLS decide quem pode escrever em qual conversa. */
export async function enviarMensagem(conversaId: string, formData: FormData): Promise<ResultadoMensagem> {
  const profile = await getProfile();
  if (!profile) return { ok: false, erro: "Não autenticado." };

  const texto = ((formData.get("texto") as string) || "").trim();
  if (!texto) return { ok: false, erro: "Escreva uma mensagem." };

  const supabase = createClient();
  const { error } = await supabase.from("mensagens").insert({
    conversa_id: conversaId,
    remetente_id: profile.id,
    texto,
  });

  revalidatePath("/professor/chat");
  revalidatePath("/aluno/chat");
  if (error) return { ok: false, erro: error.message };
  return { ok: true };
}
