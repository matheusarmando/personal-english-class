import { createClient, getProfile } from "@/lib/supabase/server";
import { LABEL_TIPO_AGENDAMENTO } from "@/lib/calendario";
import { excluirAgendamentoAvulso } from "./actions";
import FormNovoAgendamento from "./FormNovoAgendamento";

export default async function AgendamentosPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: agendamentos } = await supabase
    .from("agendamentos_avulsos")
    .select("id, nome, tipo, data_hora, email, telefone, observacoes")
    .eq("professor_id", profile?.id)
    .order("data_hora");

  return (
    <main className="px-8 py-10">
      <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
        Área do professor
      </p>
      <h1 className="font-display font-semibold text-3xl mb-8">Agendamentos avulsos</h1>

      <div className="max-w-2xl space-y-10">
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Novo agendamento</h2>
          <p className="text-xs text-ink/50 mb-3">
            Para compromissos pontuais que não fazem parte da agenda
            recorrente de um aluno já cadastrado — por exemplo, um teste de
            proficiência ou uma aula experimental.
          </p>
          <FormNovoAgendamento />
        </section>

        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Próximos agendamentos</h2>
          {!agendamentos || agendamentos.length === 0 ? (
            <p className="text-sm text-ink/60">
              Nenhum agendamento avulso cadastrado ainda.
            </p>
          ) : (
            <ul className="divide-y divide-line border border-line rounded-xl overflow-hidden bg-white/60">
              {agendamentos.map((a) => {
                const dt = new Date(a.data_hora);
                return (
                  <li
                    key={a.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{a.nome}</p>
                      <p className="text-xs text-ink/50">
                        {LABEL_TIPO_AGENDAMENTO[a.tipo] ?? a.tipo} ·{" "}
                        {dt.toLocaleDateString("pt-BR")}{" "}
                        {dt.toLocaleTimeString("pt-BR", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <form action={excluirAgendamentoAvulso.bind(null, a.id)}>
                      <button
                        type="submit"
                        className="text-xs text-bad hover:underline"
                      >
                        Excluir
                      </button>
                    </form>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
