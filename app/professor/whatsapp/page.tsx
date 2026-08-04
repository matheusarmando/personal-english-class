import { createClient, getProfile } from "@/lib/supabase/server";
import { atualizarConfigWhatsapp } from "./actions";

const LABEL_TIPO: Record<string, string> = {
  lembrete_aula: "Lembrete de aula",
  resumo_aula: "Resumo pós-aula",
  cobranca: "Cobrança (legado)",
  parcela_lembrete: "Lembrete de parcela",
  parcela_atraso: "Parcela atrasada",
};

export default async function WhatsappPage() {
  const profile = await getProfile();
  const supabase = createClient();
  const configurado = Boolean(process.env.WHATSAPP_CLOUD_API_TOKEN);

  const { data: mensagens } = await supabase
    .from("whatsapp_mensagens")
    .select("id, tipo, destinatario_telefone, status, erro, created_at, alunos(nome)")
    .eq("professor_id", profile?.id)
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display font-semibold text-2xl">WhatsApp</h1>
        <span className="text-sm text-ink/50">Área do professor</span>
      </div>

      {!configurado && (
        <div className="max-w-xl mb-8 rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm text-ink/80">
          <p className="font-semibold text-warn mb-1">
            Integração ainda não configurada no servidor
          </p>
          <p>
            Faltam as credenciais da Meta Cloud API (
            <code className="text-xs">WHATSAPP_CLOUD_API_TOKEN</code>,{" "}
            <code className="text-xs">WHATSAPP_PHONE_NUMBER_ID</code>). Até lá,
            o número abaixo fica salvo, mas nenhuma mensagem é enviada de
            verdade — os envios ficam registrados como falha.
          </p>
        </div>
      )}

      <div className="max-w-xl space-y-10">
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">
            Automação por WhatsApp
          </h2>
          <form
            action={atualizarConfigWhatsapp}
            className="bg-white border border-line rounded-xl p-6 space-y-4"
          >
            <p className="text-sm text-ink/60">
              As mensagens são enviadas pelo número oficial da plataforma no
              WhatsApp — você não precisa cadastrar um número próprio. Aqui
              você só liga ou desliga o envio automático pros seus alunos.
            </p>

            <div className="flex items-center gap-2">
              <input
                id="whatsapp_ativo"
                name="whatsapp_ativo"
                type="checkbox"
                defaultChecked={profile?.whatsapp_ativo}
                className="rounded border-line"
              />
              <label className="text-sm" htmlFor="whatsapp_ativo">
                Enviar lembretes, resumos e cobranças automaticamente
              </label>
            </div>

            <div>
              <label className="block text-sm mb-1" htmlFor="financeiro_dias_lembrete">
                Avisar parcela a vencer com quantos dias de antecedência
              </label>
              <input
                id="financeiro_dias_lembrete"
                name="financeiro_dias_lembrete"
                type="number"
                min="0"
                max="30"
                defaultValue={profile?.financeiro_dias_lembrete ?? 3}
                className="w-24 rounded-lg border border-line bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              />
            </div>

            <button
              type="submit"
              className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
            >
              Salvar
            </button>
          </form>
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">
            Mensagens recentes
          </h2>
          {!mensagens || mensagens.length === 0 ? (
            <p className="text-sm text-ink/60">
              Nenhuma mensagem enviada ainda.
            </p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white">
              {mensagens.map((m: any) => (
                <li key={m.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">
                      {LABEL_TIPO[m.tipo] ?? m.tipo} · {m.alunos?.nome ?? "—"}
                    </p>
                    <p className="text-xs text-ink/50">
                      {m.destinatario_telefone} ·{" "}
                      {new Date(m.created_at).toLocaleString("pt-BR")}
                      {m.status === "falhou" && m.erro ? ` · ${m.erro}` : ""}
                    </p>
                  </div>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      m.status === "enviada"
                        ? "bg-good/15 text-good"
                        : m.status === "falhou"
                        ? "bg-bad/15 text-bad"
                        : "bg-warn/15 text-warn"
                    }`}
                  >
                    {m.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
