"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "application/pdf"];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

export async function enviarComprovante(parcelaId: string, formData: FormData) {
  const profile = await getProfile();
  if (!profile) return { ok: false, erro: "Não autenticado." };

  const arquivo = formData.get("arquivo") as File | null;
  if (!arquivo || arquivo.size === 0) {
    return { ok: false, erro: "Selecione um arquivo." };
  }
  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    return { ok: false, erro: "Envie uma imagem (JPEG/PNG) ou um PDF." };
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { ok: false, erro: "Arquivo muito grande (máximo 5MB)." };
  }

  const supabase = createClient();
  const caminho = `${parcelaId}/${Date.now()}-${arquivo.name}`;

  const { error: erroUpload } = await supabase.storage
    .from("comprovantes-financeiro")
    .upload(caminho, arquivo, { contentType: arquivo.type });

  if (erroUpload) {
    return { ok: false, erro: erroUpload.message };
  }

  const { error } = await supabase.from("parcela_comprovantes").insert({
    parcela_id: parcelaId,
    enviado_por: profile.id,
    arquivo_path: caminho,
    nome_arquivo: arquivo.name,
    tipo_arquivo: arquivo.type,
    tamanho_bytes: arquivo.size,
  });

  if (error) {
    return { ok: false, erro: error.message };
  }

  revalidatePath("/aluno/financeiro");
  return { ok: true, erro: null };
}
