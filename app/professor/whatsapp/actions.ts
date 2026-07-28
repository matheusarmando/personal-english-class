"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export async function atualizarConfigWhatsapp(formData: FormData) {
  const profile = await getProfile();
  if (!profile) return;

  const supabase = createClient();
  const ativo = formData.get("whatsapp_ativo") === "on";

  await supabase
    .from("profiles")
    .update({ whatsapp_ativo: ativo })
    .eq("id", profile.id);

  revalidatePath("/professor/whatsapp");
}
