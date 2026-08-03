import { createClient, getProfile } from "@/lib/supabase/server";
import FormPaginaPublica from "./FormPaginaPublica";
import { atualizarStatusSolicitacao } from "./actions";

const LABEL_STATUS: Record<string, string> = {
  pendente: "Pendente",
  confirmado: "Confirmado",
  recusado: "Recusado",
};

export default async function PaginaPublicaProfessorSettings() {
  const profile = await getProfile();
  const supabase = createClient();
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  const { data: dadosPagina } = await supabase
    .from("profiles")
    .select("slug, bio, preco_aula, pagina_publica_ativa")
    .eq("id", profile?.id)
    .single();

  const { data: solicitacoes } = await supabase
    .from("agendamentos_avulsos")
    .select("id, nome, email, telefone, observacoes, status, created_at")
    .eq("professor_id", profile?.id)
    .eq("origem", "publico")
    .order("created_at", { ascending: false });

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display font-semibold text-2xl">Página pública</h1>
        <span className="text-sm text-ink/50">Área do professor</span>
      </div>

      <p className="text-sm text-ink/60 max-w-xl mb-6">
        Ative sua página pública e compartilhe o link (bio do Instagram, status
        do WhatsApp) para que interessados possam pedir uma aula sem precisar
        se cadastrar na plataforma.
      </p>

      <div className="max-w-xl space-y-10">
        <section>
          <FormPaginaPublica
            slugAtual={dadosPagina?.slug ?? null}
            bioAtual={dadosPagina?.bio ?? null}
            precoAtual={dadosPagina?.preco_aula ?? null}
            ativaAtual={dadosPagina?.pagina_publica_ativa ?? false}
            baseUrl={baseUrl}
          />
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">
            Solicitações recebidas
          </h2>
          {!solicitacoes || solicitacoes.length === 0 ? (
            <p className="text-sm text-ink/60">
              Nenhuma solicitação pela página pública ainda.
            </p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
              {solicitacoes.map((s) => (
                <li key={s.id} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{s.nome}</p>
                      <p className="text-xs text-ink/50">
                        {[s.email, s.telefone].filter(Boolean).join(" · ") || "Sem contato informado"}
                        {" · "}
                        {new Date(s.created_at).toLocaleDateString("pt-BR")}
                      </p>
                      {s.observacoes && (
                        <p className="text-sm text-ink/70 mt-1">{s.observacoes}</p>
                      )}
                    </div>
                    <span
                      className={`shrink-0 text-xs font-semibold px-2 py-1 rounded-full ${
                        s.status === "confirmado"
                          ? "bg-good/15 text-good"
                          : s.status === "recusado"
                          ? "bg-bad/15 text-bad"
                          : "bg-warn/15 text-warn"
                      }`}
                    >
                      {LABEL_STATUS[s.status] ?? s.status}
                    </span>
                  </div>

                  {s.status === "pendente" && (
                    <div className="flex gap-2 mt-2">
                      <form action={atualizarStatusSolicitacao.bind(null, s.id, "confirmado")}>
                        <button
                          type="submit"
                          className="text-xs font-semibold text-good hover:underline"
                        >
                          Aceitar
                        </button>
                      </form>
                      <form action={atualizarStatusSolicitacao.bind(null, s.id, "recusado")}>
                        <button
                          type="submit"
                          className="text-xs font-semibold text-bad hover:underline"
                        >
                          Recusar
                        </button>
                      </form>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
