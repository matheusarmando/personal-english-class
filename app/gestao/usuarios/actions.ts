"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function promoverUsuario(profileId: string, formData: FormData) {
  const supabase = createClient();
  const novoRole = formData.get("role") as string;

  const { error } = await supabase.rpc("promover_usuario", {
    p_profile_id: profileId,
    p_novo_role: novoRole,
  });

  if (error) {
    console.error("Erro ao promover usuário:", error.message);
  }

  revalidatePath("/gestao/usuarios");
}
