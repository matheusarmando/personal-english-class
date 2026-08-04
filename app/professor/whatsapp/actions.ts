"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

export async function atualizarConfigWhatsapp(formData: FormData) {
  const profile = await getProfile();
  if (!profile) return;

  const supabase = createClient();
  const ativo = formData.get("whatsapp_ativo") === "on";
  const diasLembrete = Number(formData.get("financeiro_dias_lembrete") ?? 3);

  await supabase
    .from("profiles")
    .update({ whatsapp_ativo: ativo, financeiro_dias_lembrete: diasLembrete })
    .eq("id", profile.id);

  revalidatePath("/professor/whatsapp");
}
