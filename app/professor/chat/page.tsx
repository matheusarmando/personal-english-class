import { createClient, getProfile } from "@/lib/supabase/server";
import BadgePrototipo from "@/components/BadgePrototipo";
import ChatMock from "./ChatMock";

export default async function ChatPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-4">Chat</h1>
      <BadgePrototipo />
      <ChatMock alunos={alunos ?? []} />
    </main>
  );
}
