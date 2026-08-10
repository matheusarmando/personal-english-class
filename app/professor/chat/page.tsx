import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import { obterOuCriarConversa } from "@/lib/chat";
import EnviarMensagemForm from "@/components/EnviarMensagemForm";
import ThreadMensagens from "@/components/ThreadMensagens";

// Sem realtime nesta fase — precisa reconsultar o banco a cada troca
// de aluno selecionado ou envio de mensagem.
export const dynamic = "force-dynamic";

export default async function ChatPage({
  searchParams,
}: {
  searchParams: { aluno?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: alunos } = await supabase
    .from("alunos")
    .select("id, nome")
    .eq("professor_id", profile?.id)
    .eq("ativo", true)
    .order("nome");

  const listaAlunos = alunos ?? [];
  const selecionadoId = searchParams.aluno ?? listaAlunos[0]?.id;
  const alunoSelecionado = listaAlunos.find((a) => a.id === selecionadoId);
  // No mobile as duas colunas viram telas separadas — só mostra a
  // conversa quando o aluno foi escolhido de verdade (não o default).
  const mobileMostrandoThread = Boolean(searchParams.aluno);

  let mensagens: { id: string; remetenteId: string; texto: string; hora: string }[] = [];
  let conversaId: string | null = null;

  if (profile && selecionadoId) {
    conversaId = await obterOuCriarConversa(supabase, profile.id, selecionadoId);
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
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Chat</h1>

      {listaAlunos.length === 0 ? (
        <p className="text-sm text-ink/60 max-w-xl">
          Cadastre pelo menos um aluno ativo em{" "}
          <span className="font-medium">Alunos</span> pra ter conversas aqui.
        </p>
      ) : (
        <div className="max-w-3xl border border-line rounded-xl bg-white overflow-hidden grid grid-cols-1 md:grid-cols-[13rem_1fr] h-[70vh] md:h-[32rem]">
          <aside
            className={`border-r border-line overflow-y-auto ${
              mobileMostrandoThread ? "hidden md:block" : "block"
            }`}
          >
            {listaAlunos.map((a) => (
              <Link
                key={a.id}
                href={`/professor/chat?aluno=${a.id}`}
                prefetch={false}
                className={`block w-full text-left px-4 py-3 text-sm border-b border-line transition-colors ${
                  a.id === selecionadoId ? "bg-accentSoft/50 font-medium" : "hover:bg-paper"
                }`}
              >
                {a.nome}
              </Link>
            ))}
          </aside>

          <div className={`flex-col ${mobileMostrandoThread ? "flex" : "hidden md:flex"}`}>
            <div className="px-4 py-3 border-b border-line flex items-center gap-2">
              <Link href="/professor/chat" prefetch={false} className="text-ink/50 hover:text-ink md:hidden">
                ←
              </Link>
              <p className="text-sm font-semibold">{alunoSelecionado?.nome}</p>
            </div>

            <ThreadMensagens mensagens={mensagens} meuProfileId={profile?.id ?? ""} />

            {conversaId && <EnviarMensagemForm conversaId={conversaId} />}
          </div>
        </div>
      )}
    </main>
  );
}
