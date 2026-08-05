"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";

const TIPOS_PERMITIDOS = ["image/jpeg", "image/png", "application/pdf"];
const TAMANHO_MAXIMO_BYTES = 5 * 1024 * 1024;

/**
 * O `type` do File vem do Content-Type que o próprio cliente declara
 * no FormData — trivialmente falsificável numa requisição forjada.
 * Aqui conferimos os magic bytes reais do arquivo, não só o que ele
 * diz que é.
 */
function magicBytesBatem(bytes: Uint8Array, tipoDeclarado: string): boolean {
  if (tipoDeclarado === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (tipoDeclarado === "image/png") {
    const assinatura = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
    return assinatura.every((b, i) => bytes[i] === b);
  }
  if (tipoDeclarado === "application/pdf") {
    const assinatura = [0x25, 0x50, 0x44, 0x46, 0x2d]; // "%PDF-"
    return assinatura.every((b, i) => bytes[i] === b);
  }
  return false;
}

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

  const cabecalho = new Uint8Array(await arquivo.slice(0, 8).arrayBuffer());
  if (!magicBytesBatem(cabecalho, arquivo.type)) {
    return { ok: false, erro: "O conteúdo do arquivo não corresponde ao tipo declarado." };
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
