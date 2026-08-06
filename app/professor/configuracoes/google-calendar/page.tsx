import { getProfile } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { obterAccessTokenValido } from "@/lib/google-calendar/tokens";
import { listarCalendarios } from "@/lib/google-calendar/client";
import { desconectarGoogleCalendar, atualizarConfiguracoesGoogleCalendar } from "./actions";

const LABEL_STATUS: Record<string, string> = {
  conectado: "Conectado",
  erro: "Erro",
  reauth_necessario: "Reautorização necessária",
  desconectado: "Desconectado",
};

const LABEL_ERRO: Record<string, string> = {
  consentimento_negado: "Você cancelou a autorização no Google.",
  parametros_invalidos: "Resposta inesperada do Google — tente conectar de novo.",
  state_invalido: "Sessão de autorização inválida ou expirada — tente conectar de novo.",
  sessao_oauth_expirada: "Demorou demais pra concluir a autorização — tente de novo.",
  troca_token_falhou: "O Google recusou a troca de código por token.",
  sem_refresh_token: "O Google não devolveu permissão de acesso contínuo — desconecte no Google e tente conectar de novo.",
  falha_ao_listar_calendarios: "Não consegui listar seus calendários.",
  falha_ao_salvar_conta: "Não consegui salvar a conexão.",
  integracao_nao_configurada: "Integração não configurada neste ambiente (falta SUPABASE_SERVICE_ROLE_KEY no servidor).",
};

export default async function GoogleCalendarSettingsPage({
  searchParams,
}: {
  searchParams: { erro?: string };
}) {
  const profile = await getProfile();

  let admin: ReturnType<typeof createAdminClient> | null = null;
  try {
    admin = createAdminClient();
  } catch {
    // sem SUPABASE_SERVICE_ROLE_KEY configurada neste ambiente —
    // mostra a tela com um aviso claro em vez de derrubar a página.
  }

  const { data: conta } = admin
    ? await admin
        .from("google_calendar_accounts")
        .select(
          "id, google_account_email, status, calendarios_selecionados, primary_calendar_id, ignorar_dia_inteiro, ocultar_titulo_para_aluno, escrita_habilitada"
        )
        .eq("professor_id", profile?.id)
        .maybeSingle()
    : { data: null };

  const { data: ultimoLog } = admin && conta
    ? await admin
        .from("google_sync_logs")
        .select("resultado, erro, created_at")
        .eq("account_id", conta.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : { data: null };

  let calendariosDisponiveis: { id: string; summary: string }[] = [];
  if (admin && conta && conta.status === "conectado") {
    const tokenResultado = await obterAccessTokenValido(admin, conta.id);
    if (tokenResultado.ok) {
      const resultado = await listarCalendarios(tokenResultado.accessToken);
      if (resultado.ok) calendariosDisponiveis = resultado.data;
    }
  }

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Google Calendar</h1>

      <div className="max-w-xl space-y-6">
        {!admin && (
          <div className="rounded-xl border border-warn/40 bg-warn/10 p-4 text-sm text-ink/80">
            <p className="font-semibold text-warn mb-1">
              Integração ainda não configurada neste ambiente
            </p>
            <p>
              Falta a variável <code className="text-xs">SUPABASE_SERVICE_ROLE_KEY</code> no
              servidor. Ela fica em Project Settings → API → "service_role" no painel do
              Supabase.
            </p>
          </div>
        )}

        {searchParams.erro && (
          <div className="rounded-xl border border-bad/40 bg-bad/10 p-4 text-sm text-bad">
            {LABEL_ERRO[searchParams.erro] ?? "Não consegui conectar com o Google."}
          </div>
        )}

        {!conta ? (
          <section className="bg-white border border-line rounded-xl p-6">
            <p className="text-sm text-ink/60 mb-4">
              Conecte sua agenda pessoal do Google pra a plataforma evitar marcar
              aula em cima de compromissos que você já tem. Só é usado pra{" "}
              <strong>ler</strong> disponibilidade — nada é criado, alterado ou
              apagado na sua agenda.
            </p>
            <a
              href="/api/google-calendar/oauth/start"
              className="inline-block rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
            >
              Conectar Google Calendar
            </a>
          </section>
        ) : (
          <>
            <section className="bg-white border border-line rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-sm">Conexão</h2>
                <span
                  className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    conta.status === "conectado"
                      ? "bg-good/15 text-good"
                      : conta.status === "reauth_necessario"
                      ? "bg-warn/15 text-warn"
                      : "bg-bad/15 text-bad"
                  }`}
                >
                  {LABEL_STATUS[conta.status] ?? conta.status}
                </span>
              </div>

              <dl className="text-sm space-y-1.5 mb-4">
                <div className="flex justify-between">
                  <dt className="text-ink/50">Conta conectada</dt>
                  <dd>{conta.google_account_email}</dd>
                </div>
                {ultimoLog && (
                  <div className="flex justify-between">
                    <dt className="text-ink/50">Última sincronização</dt>
                    <dd>
                      {new Date(ultimoLog.created_at).toLocaleString("pt-BR")} ·{" "}
                      <span className={ultimoLog.resultado === "sucesso" ? "text-good" : "text-bad"}>
                        {ultimoLog.resultado}
                      </span>
                    </dd>
                  </div>
                )}
              </dl>

              {conta.status === "reauth_necessario" && (
                <p className="text-xs text-warn mb-3">
                  O acesso foi revogado do lado do Google. Conecte de novo pra
                  voltar a checar sua agenda.
                </p>
              )}

              <div className="flex gap-3">
                <a
                  href="/api/google-calendar/oauth/start"
                  className="text-xs font-semibold text-accent hover:underline"
                >
                  {conta.status === "reauth_necessario" ? "Reconectar" : "Reconectar / trocar conta"}
                </a>
                <form action={desconectarGoogleCalendar}>
                  <button type="submit" className="text-xs font-semibold text-bad hover:underline">
                    Desconectar
                  </button>
                </form>
              </div>
            </section>

            <section className="bg-white border border-line rounded-xl p-6">
              <h2 className="font-display font-semibold text-sm mb-3">Preferências</h2>
              <form action={atualizarConfiguracoesGoogleCalendar} className="space-y-4">
                <div>
                  <p className="text-sm mb-2">Quais calendários considerar</p>
                  {calendariosDisponiveis.length === 0 ? (
                    <p className="text-xs text-ink/50">
                      Não consegui listar seus calendários agora — tente recarregar a página.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {calendariosDisponiveis.map((c) => (
                        <label key={c.id} className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            name="calendarios_selecionados"
                            value={c.id}
                            defaultChecked={
                              conta.calendarios_selecionados.includes(c.id) ||
                              (conta.calendarios_selecionados.length === 0 && c.id === conta.primary_calendar_id)
                            }
                            className="rounded border-line"
                          />
                          {c.summary}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="ignorar_dia_inteiro"
                    name="ignorar_dia_inteiro"
                    type="checkbox"
                    defaultChecked={conta.ignorar_dia_inteiro}
                    className="rounded border-line"
                  />
                  <label className="text-sm" htmlFor="ignorar_dia_inteiro">
                    Não bloquear meu dia quando eu tiver um evento de dia inteiro
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    id="ocultar_titulo_para_aluno"
                    name="ocultar_titulo_para_aluno"
                    type="checkbox"
                    defaultChecked={conta.ocultar_titulo_para_aluno}
                    className="rounded border-line"
                  />
                  <label className="text-sm" htmlFor="ocultar_titulo_para_aluno">
                    Mostrar só "Ocupado" (sem título) na minha agenda dentro da plataforma
                  </label>
                </div>

                <div className="border-t border-line pt-4">
                  <div className="flex items-center gap-2">
                    <input
                      id="escrita_habilitada"
                      name="escrita_habilitada"
                      type="checkbox"
                      defaultChecked={conta.escrita_habilitada}
                      className="rounded border-line"
                    />
                    <label className="text-sm font-medium" htmlFor="escrita_habilitada">
                      Também criar e cancelar eventos automaticamente no meu Google Calendar
                    </label>
                  </div>
                  <p className="text-xs text-ink/50 mt-2">
                    Com isso ligado, cada aula que você agendar na plataforma vira um evento no
                    seu calendário principal do Google (e some de lá quando você remove a aula
                    aqui). A plataforma é sempre quem manda: se você editar ou apagar o evento
                    direto no Google, a próxima alteração feita aqui pode sobrescrever.
                  </p>
                </div>

                <button
                  type="submit"
                  className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
                >
                  Salvar
                </button>
              </form>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
