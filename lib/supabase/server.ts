import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch {
            // chamado de um Server Component: middleware cuida do refresh da sessão
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: "", ...options });
          } catch {
            // idem acima
          }
        },
      },
    }
  );
}

/** Papéis suportados pelo sistema. Mantido em um único lugar para facilitar evolução. */
export type UserRole = "aluno" | "professor" | "gestor";

export async function getProfile() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, nome, role, telefone, data_nascimento")
    .eq("id", user.id)
    .single();

  if (!profile) return null;

  return {
    ...profile,
    email: user.email ?? null,
  } as {
    id: string;
    nome: string;
    role: UserRole;
    telefone: string | null;
    data_nascimento: string | null;
    email: string | null;
  };
}
