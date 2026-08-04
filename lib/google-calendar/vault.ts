import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Casca fina sobre as funções `gcal_*` (migration 0021), que por sua
 * vez encapsulam o Supabase Vault. Só funciona com o admin client
 * (service role) — as funções revogam EXECUTE de anon/authenticated
 * no banco, então chamar isso com o client comum sempre falha por
 * design.
 */
export async function salvarSegredo(
  supabase: SupabaseClient,
  segredo: string,
  nome: string
): Promise<string> {
  const { data, error } = await supabase.rpc("gcal_salvar_segredo", {
    p_segredo: segredo,
    p_nome: nome,
  });
  if (error) throw new Error(`Falha ao salvar segredo no Vault: ${error.message}`);
  return data as string;
}

export async function lerSegredo(supabase: SupabaseClient, id: string): Promise<string | null> {
  const { data, error } = await supabase.rpc("gcal_ler_segredo", { p_id: id });
  if (error) throw new Error(`Falha ao ler segredo no Vault: ${error.message}`);
  return data as string | null;
}

export async function atualizarSegredo(
  supabase: SupabaseClient,
  id: string,
  novoValor: string
): Promise<void> {
  const { error } = await supabase.rpc("gcal_atualizar_segredo", {
    p_id: id,
    p_novo_valor: novoValor,
  });
  if (error) throw new Error(`Falha ao atualizar segredo no Vault: ${error.message}`);
}

export async function removerSegredo(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.rpc("gcal_remover_segredo", { p_id: id });
  if (error) throw new Error(`Falha ao remover segredo no Vault: ${error.message}`);
}
