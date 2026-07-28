import { createClient } from "@supabase/supabase-js";

/**
 * Client com a service role key — ignora RLS. Uso exclusivo em rotas
 * de servidor que rodam sem um usuário logado (cron, webhook). Nunca
 * importar isso em código que possa rodar no client.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Supabase admin client não configurado (faltam variáveis de ambiente)");
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
