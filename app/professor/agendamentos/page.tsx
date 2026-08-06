import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import { LABEL_TIPO_AGENDAMENTO } from "@/lib/calendario";
import { excluirAgendamentoAvulso } from "./actions";
import ResponderSolicitacaoForm from "./ResponderSolicitacaoForm";
import ConfirmarAcao from "@/components/ConfirmarAcao";
import EstadoVazio from "@/components/EstadoVazio";

const LABEL_TIPO_SOLICITACAO: Record<string, string> = {
  remarcacao: "Remarcação",
  cancelamento: "Cancelamento",
  aula_extra: "Aula extra",
};

function formatarDataHora(iso: string) {
  const dt = new Date(iso);
  return `${dt.toLocaleDateString("pt-BR")} ${dt.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export default async function AgendamentosPage() {
  const profile = await getProfile();
  const supabase = createClient();

  const { data: agendamentos } = await supabase
    .from("agendamentos_avulsos")
    .select("id, nome, tipo, data_hora, email, telefone, observacoes")
    .eq("professor_id", profile?.id)
    .order("data_hora");

  const { data: solicitacoes } = await supabase
    .from("solicitacoes_agendamento")
    .select("id, aluno_id, tipo, motivo, aula_horario_id, data_hora_sugerida, created_at")
    .eq("professor_id", profile?.id)
    .eq("status", "pendente")
    .order("created_at");

  const listaSolicitacoes = solicitacoes ?? [];

  const alunoIds = [...new Set(listaSolicitacoes.map((s) => s.aluno_id))];
  const { data: alunosEnvolvidos } = alunoIds.length
    ? await supabase.from("alunos").select("id, nome").in("id", alunoIds)
    : { data: [] };
  const nomePorAlunoId = new Map((alunosEnvolvidos ?? []).map((a) => [a.id, a.nome]));

  const horarioIds = listaSolicitacoes
    .map((s) => s.aula_horario_id)
    .filter((id): id is string => Boolean(id));
  const { data: horariosOriginais } = horarioIds.length
    ? await supabase.from("aluno_horarios").select("id, data_hora").in("id", horarioIds)
    : { data: [] };
  const dataHoraOriginalPorHorarioId = new Map(
    (horariosOriginais ?? []).map((h) => [h.id, h.data_hora])
  );

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-8">
        <div>
          <p className="uppercase tracking-[0.2em] text-xs text-accent font-medium mb-2">
            Área do professor
          </p>
          <h1 className="font-display font-semibold text-3xl">Agendamentos avulsos</h1>
        </div>
        <Link
          href="/professor/agendamentos/novo"
          className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
        >
          Novo agendamento
        </Link>
      </div>

      <div className="max-w-2xl space-y-10">
        <section>
          <h2 className="font-display font-semibold text-lg mb-3">Solicitações dos alunos</h2>
          {listaSolicitacoes.length === 0 ? (
            <EstadoVazio texto="Nenhuma solicitação pendente." />
          ) : (
            <ul className="space-y-3">
              {listaSolicitacoes.map((s) => {
                const dataHoraOriginal = s.aula_horario_id
                  ? dataHoraOriginalPorHorarioId.get(s.aula_horario_id)
                  : null;
                return (
                  <li key={s.id} className="border border-line rounded-xl bg-white p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">
                          {nomePorAlunoId.get(s.aluno_id) ?? "Aluno"} ·{" "}
                          {LABEL_TIPO_SOLICITACAO[s.tipo] ?? s.tipo}
                        </p>
                        {dataHoraOriginal && (
                          <p className="text-xs text-ink/50 mt-0.5">
                            Aula original: {formatarDataHora(dataHoraOriginal)}
                          </p>
                        )}
                        {s.tipo === "remarcacao" && s.data_hora_sugerida && (
                          <p className="text-xs text-ink/50">
                            Sugestão do aluno: {formatarDataHora(s.data_hora_sugerida)}
                          </p>
                        )}
                        {s.motivo && (
                          <p className="text-xs text-ink/60 mt-1">"{s.motivo}"</p>
                        )}
                      </div>
                    </div>

                    <ResponderSolicitacaoForm solicitacaoId={s.id} />
                  </li>
                );
              })}
            </ul>
          )}
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
                    <ConfirmarAcao
                      action={excluirAgendamentoAvulso.bind(null, a.id)}
                      rotulo="Excluir"
                      titulo="Excluir este agendamento?"
                      mensagem={`Remove o agendamento de ${a.nome}. Essa ação não pode ser desfeita.`}
                    />
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
