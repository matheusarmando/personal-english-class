import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificacaoSino } from "@/components/SinoNotificacoes";

const LIMITE_NOTIFICACOES_SINO = 10;

/** Notificações mais recentes do usuário logado, pro sino no Topbar — compartilhado pelos 3 layouts (professor/aluno/gestão). */
export async function buscarNotificacoesSino(
  supabase: SupabaseClient,
  profileId: string | undefined
): Promise<NotificacaoSino[]> {
  if (!profileId) return [];

  const { data } = await supabase
    .from("notificacoes")
    .select("id, titulo, mensagem, lida")
    .eq("destinatario_id", profileId)
    .order("created_at", { ascending: false })
    .limit(LIMITE_NOTIFICACOES_SINO);

  return data ?? [];
}
