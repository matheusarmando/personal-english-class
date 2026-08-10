import { createClient, getProfile } from "@/lib/supabase/server";
import { obterOuCriarConversa } from "@/lib/chat";
import EnviarMensagemForm from "@/components/EnviarMensagemForm";
import ThreadMensagens from "@/components/ThreadMensagens";
import EstadoVazio from "@/components/EstadoVazio";

// Sem realtime nesta fase — precisa reconsultar o banco a cada envio.
export const dynamic = "force-dynamic";

export default async function AlunoChatPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: aluno } = await supabase
    .from("alunos")
    .select("id, professor_id")
    .eq("profile_id", profile?.id)
    .maybeSingle();

  let mensagens: { id: string; remetenteId: string; texto: string; hora: string }[] = [];
  let conversaId: string | null = null;

  if (aluno) {
    conversaId = await obterOuCriarConversa(supabase, aluno.professor_id, aluno.id);
    if (conversaId) {
      const { data: msgs } = await supabase
        .from("mensagens")
        .select("id, remetente_id, texto, created_at")
        .eq("conversa_id", conversaId)
        .order("created_at");
      mensagens = (msgs ?? []).map((m) => ({
        id: m.id,
        remetenteId: m.remetente_id,
        texto: m.texto,
        hora: new Date(m.created_at).toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      }));
    }
  }

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do aluno
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Chat</h1>

      {!aluno ? (
        <EstadoVazio texto="Cadastro de aluno não encontrado." />
      ) : (
        <div className="max-w-2xl border border-line rounded-xl bg-white overflow-hidden flex flex-col h-[70vh] md:h-[32rem]">
          <ThreadMensagens mensagens={mensagens} meuProfileId={profile?.id ?? ""} />
          {conversaId && <EnviarMensagemForm conversaId={conversaId} />}
        </div>
      )}
    </main>
  );
}
