"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

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
}
