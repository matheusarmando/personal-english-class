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
    global: {
      // O Next.js (App Router) intercepta o `fetch` global e cacheia
      // por padrão, mesmo em rotas dinâmicas — sem isso, uma consulta
      // feita pelo admin client pode ficar presa num resultado antigo
      // (ex.: "sem eventos do Google") até o cache expirar sozinho,
      // já que nada aqui chama revalidatePath depois de sincronizar.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}
