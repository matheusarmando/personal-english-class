"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

function normalizarSlug(valor: string) {
  return valor
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function atualizarPaginaPublica(formData: FormData) {
  const profile = await getProfile();
  if (!profile) return { ok: false, erro: "Não autenticado." };

  const supabase = createClient();
  const slug = normalizarSlug(formData.get("slug") as string);
  const bio = formData.get("bio") as string;
  const precoAulaRaw = formData.get("preco_aula") as string;
  const ativa = formData.get("pagina_publica_ativa") === "on";

  if (ativa && !slug) {
    return { ok: false, erro: "Defina um link antes de ativar a página." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      slug: slug || null,
      bio: bio || null,
      preco_aula: precoAulaRaw ? Number(precoAulaRaw) : null,
      pagina_publica_ativa: ativa,
    })
    .eq("id", profile.id);

  revalidatePath("/professor/pagina-publica");

  if (error) {
    if (error.code === "23505") {
      return { ok: false, erro: "Esse link já está em uso por outro professor." };
    }
    return { ok: false, erro: error.message };
  }

  return { ok: true, erro: null };
}

export async function atualizarStatusSolicitacao(id: string, status: "confirmado" | "recusado") {
  const supabase = createClient();
  await supabase.from("agendamentos_avulsos").update({ status }).eq("id", id);
  revalidatePath("/professor/pagina-publica");
}
