import Link from "next/link";
import { createClient, getProfile } from "@/lib/supabase/server";
import { buscarEventosGooglePorDia } from "@/lib/google-calendar/eventos-do-mes";
import { criarAula } from "./actions";
import ListaChamada from "@/components/ListaChamada";
import CalendarioMensal from "@/components/CalendarioMensal";
import WidgetCard from "@/components/WidgetCard";
import EstadoVazio from "@/components/EstadoVazio";
import WidgetNotificacoes from "@/components/WidgetNotificacoes";
import { IconUsers, IconCalendar, IconWallet, IconGift, IconDocument, IconMegaphone } from "@/components/icons";
import {
  chaveDia,
  resolverMesReferencia,
  LABEL_TIPO_AGENDAMENTO,
  type AulaDoDia,
} from "@/lib/calendario";
import { statusEfetivo } from "@/lib/financeiro/status";

// Sem isso, o Next.js pode cachear a página (HTML e as respostas RSC
// das navegações client-side, ex.: os links "Anterior/Próximo" do
// calendário) e servir sempre o mesmo mês/estado antigo em vez de
// reconsultar o banco a cada troca de ?mes=.
export const dynamic = "force-dynamic";

export default async function ProfessorPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const profile = await getProfile();
  const supabase = createClient();

  const mesRef = resolverMesReferencia(searchParams.mes);
  const inicioMes = new Date(mesRef.getFullYear(), mesRef.getMonth(), 1);
  const fimMes = new Date(mesRef.getFullYear(), mesRef.getMonth() + 1, 1);

  // Compromissos do Google Calendar do mês exibido — enriquecimento,
  // nunca pode derrubar o painel (buscarEventosGooglePorDia nunca lança).
  const eventosGooglePorDia = await buscarEventosGooglePorDia(profile?.id, inicioMes, fimMes);

  const { data: meusAlunos } = await supabase
    .from("alunos")
    .select("id, nome, ativo, link_aula, data_nascimento")
    .eq("professor_id", profile?.id);

  const alunoIds = (meusAlunos ?? []).map((a) => a.id);
  const dadosPorAlunoId = new Map((meusAlunos ?? []).map((a) => [a.id, a]));

  const { data: horariosDoMes } = alunoIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("id, data_hora, aluno_id")
        .in("aluno_id", alunoIds)
        .neq("status", "cancelada")
        .gte("data_hora", inicioMes.toISOString())
        .lt("data_hora", fimMes.toISOString())
        .order("data_hora")
    : { data: [] };

  const aulasPorDia: Record<string, AulaDoDia[]> = {};
  for (const h of horariosDoMes ?? []) {
    const dt = new Date(h.data_hora);
    const chave = chaveDia(dt);
    const hora = dt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const aluno = dadosPorAlunoId.get(h.aluno_id);
    (aulasPorDia[chave] ??= []).push({
      id: h.id,
      hora,
      titulo: aluno?.nome ?? "Aluno",
      linkAula: aluno?.link_aula,
    });
  }

  const { data: agendamentosDoMes } = await supabase
    .from("agendamentos_avulsos")
    .select("id, nome, tipo, data_hora, email, telefone, observacoes")
    .eq("professor_id", profile?.id)
    .gte("data_hora", inicioMes.toISOString())
    .lt("data_hora", fimMes.toISOString())
    .order("data_hora");

  for (const a of agendamentosDoMes ?? []) {
    const dt = new Date(a.data_hora);
    const chave = chaveDia(dt);
    const hora = dt.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const contato = [a.email, a.telefone].filter(Boolean).join(" · ");
    (aulasPorDia[chave] ??= []).push({
      id: a.id,
      hora,
      titulo: `${LABEL_TIPO_AGENDAMENTO[a.tipo] ?? a.tipo} — ${a.nome}`,
      contato: contato || null,
      observacoes: a.observacoes,
    });
  }

  const alunosAtivos = (meusAlunos ?? []).filter((a) => a.ativo).length;

  const hoje = new Date();
  const inicioSemana = new Date(
    hoje.getFullYear(),
    hoje.getMonth(),
    hoje.getDate() - hoje.getDay()
  );
  const fimSemana = new Date(
    inicioSemana.getFullYear(),
    inicioSemana.getMonth(),
    inicioSemana.getDate() + 7
  );

  const { count: aulasSemanaHorarios } = alunoIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("id", { count: "exact", head: true })
        .in("aluno_id", alunoIds)
        .gte("data_hora", inicioSemana.toISOString())
        .lt("data_hora", fimSemana.toISOString())
    : { count: 0 };

  const { count: aulasSemanaAvulsos } = await supabase
    .from("agendamentos_avulsos")
    .select("id", { count: "exact", head: true })
    .eq("professor_id", profile?.id)
    .gte("data_hora", inicioSemana.toISOString())
    .lt("data_hora", fimSemana.toISOString());

  const aulasEssaSemana = (aulasSemanaHorarios ?? 0) + (aulasSemanaAvulsos ?? 0);

  const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
  const fimHoje = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth(), inicioHoje.getDate() + 1);
  const em7dias = new Date(inicioHoje.getFullYear(), inicioHoje.getMonth(), inicioHoje.getDate() + 7);

  const { data: aulasHoje } = alunoIds.length
    ? await supabase
        .from("aluno_horarios")
        .select("id, data_hora, aluno_id")
        .in("aluno_id", alunoIds)
        .neq("status", "cancelada")
        .gte("data_hora", inicioHoje.toISOString())
        .lt("data_hora", fimHoje.toISOString())
        .order("data_hora")
    : { data: [] };

  const { data: contratosProfessor } = await supabase
    .from("contratos")
    .select("id")
    .eq("professor_id", profile?.id);
  const contratoIdsProfessor = (contratosProfessor ?? []).map((c) => c.id);

  const { data: parcelasFinanceiro } = contratoIdsProfessor.length
    ? await supabase
        .from("parcelas")
        .select("id, valor_centavos, vencimento, status, contratos(alunos(nome))")
        .in("contrato_id", contratoIdsProfessor)
        .eq("status", "pendente")
        .order("vencimento")
    : { data: [] };

  const parcelasComStatusEfetivo = (parcelasFinanceiro ?? []).map((p: any) => ({
    ...p,
    efetivo: statusEfetivo({ status: p.status, vencimento: p.vencimento }, hoje),
  }));

  const pagamentosPendentes = parcelasComStatusEfetivo.filter((p) => p.efetivo === "atrasada").length;
  const proximosVencimentos = parcelasComStatusEfetivo.filter((p) => p.efetivo === "pendente").slice(0, 5);

  const { data: notificacoes } = await supabase
    .from("notificacoes")
    .select("id, titulo, mensagem")
    .eq("destinatario_id", profile?.id)
    .eq("lida", false)
    .order("created_at", { ascending: false })
    .limit(5);

  const { data: agendamentosProximos } = await supabase
    .from("agendamentos_avulsos")
    .select("id, nome, tipo, data_hora")
    .eq("professor_id", profile?.id)
    .gte("data_hora", inicioHoje.toISOString())
    .lt("data_hora", em7dias.toISOString())
    .order("data_hora")
    .limit(5);

  const mesAtual = hoje.getMonth();
  const aniversariantes = (meusAlunos ?? []).filter((a: any) => {
    if (!a.data_nascimento) return false;
    return new Date(a.data_nascimento + "T00:00:00").getMonth() === mesAtual;
  });

  const { data: turmas } = await supabase
    .from("turmas")
    .select("id, nome")
    .eq("professor_id", profile?.id);

  const primeiraTurma = turmas?.[0];

  const { data: aulas } = primeiraTurma
    ? await supabase
        .from("aulas")
        .select("id, titulo, data")
        .eq("turma_id", primeiraTurma.id)
        .order("data", { ascending: false })
    : { data: [] };

  const primeiraAula = aulas?.[0];

  let alunos: { id: string; nome: string; presente: boolean | null }[] = [];
  if (primeiraAula && primeiraTurma) {
    const { data: matriculados } = await supabase
      .from("matriculas")
      .select("profiles(id, nome)")
      .eq("turma_id", primeiraTurma.id);

    const { data: presencas } = await supabase
      .from("presencas")
      .select("aluno_id, presente")
      .eq("aula_id", primeiraAula.id);

    alunos = (matriculados ?? []).map((m: any) => ({
      id: m.profiles.id,
      nome: m.profiles.nome,
      presente:
        presencas?.find((p) => p.aluno_id === m.profiles.id)?.presente ??
        null,
    }));
  }

  return (
    <main className="px-8 py-10">
      <div className="flex items-baseline justify-between mb-6">
        <h1 className="font-display font-bold text-2xl">Olá, {profile?.nome}</h1>
        <span className="text-sm text-ink/50">Área do professor</span>
      </div>

      <section className="grid grid-cols-3 gap-4 max-w-3xl mb-8">
        <div className="border border-line rounded-xl p-4 bg-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-accentSoft text-accent flex items-center justify-center shrink-0">
            <IconUsers />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Alunos ativos</p>
            <p className="font-display font-bold text-2xl tabular-nums">{alunosAtivos}</p>
          </div>
        </div>
        <div className="border border-line rounded-xl p-4 bg-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-accentSoft text-accent flex items-center justify-center shrink-0">
            <IconCalendar />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Aulas essa semana</p>
            <p className="font-display font-bold text-2xl tabular-nums">{aulasEssaSemana}</p>
          </div>
        </div>
        <div className="border border-line rounded-xl p-4 bg-white flex items-center gap-3">
          <span className="w-10 h-10 rounded-lg bg-warn/15 text-warn flex items-center justify-center shrink-0">
            <IconWallet />
          </span>
          <div>
            <p className="text-[11px] uppercase tracking-wide text-ink/50">Pagamentos pendentes</p>
            <p className="font-display font-bold text-2xl tabular-nums text-warn">{pagamentosPendentes}</p>
          </div>
        </div>
      </section>

      <section className="max-w-3xl mb-10">
        <h2 className="font-display font-bold text-lg mb-3">Aulas do mês</h2>
        <CalendarioMensal
          mesRef={mesRef}
          aulasPorDia={aulasPorDia}
          baseHref="/professor"
          eventosGooglePorDia={eventosGooglePorDia}
        />
      </section>

      <section className="max-w-3xl mb-10 grid sm:grid-cols-3 gap-4">
        <WidgetCard titulo="Aulas de hoje">
          {!aulasHoje || aulasHoje.length === 0 ? (
            <EstadoVazio texto="Nenhuma aula hoje." />
          ) : (
            <ul className="space-y-1.5">
              {aulasHoje.map((h) => (
                <li
                  key={h.id}
                  className="flex items-center justify-between text-sm bg-paper rounded-lg px-3 py-2"
                >
                  <span className="font-medium truncate">
                    {dadosPorAlunoId.get(h.aluno_id)?.nome ?? "Aluno"}
                  </span>
                  <span className="tabular-nums text-ink/50 shrink-0">
                    {new Date(h.data_hora).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>

        <WidgetCard
          titulo="Próximos vencimentos"
          acao={
            <Link href="/professor/financeiro" className="text-xs font-semibold text-accent hover:underline">
              Ver tudo
            </Link>
          }
        >
          {proximosVencimentos.length === 0 ? (
            <EstadoVazio texto="Nenhum vencimento pendente." />
          ) : (
            <ul className="space-y-1.5">
              {proximosVencimentos.map((p: any) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between text-sm bg-paper rounded-lg px-3 py-2"
                >
                  <span className="font-medium truncate">{p.contratos?.alunos?.nome ?? "—"}</span>
                  <span className="tabular-nums text-ink/50 shrink-0">
                    {new Date(p.vencimento).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>

        <WidgetCard titulo="Agendamentos avulsos">
          {!agendamentosProximos || agendamentosProximos.length === 0 ? (
            <EstadoVazio texto="Nada nos próximos 7 dias." />
          ) : (
            <ul className="space-y-1.5">
              {agendamentosProximos.map((a) => (
                <li key={a.id} className="text-sm bg-paper rounded-lg px-3 py-2">
                  <p className="font-medium truncate">{a.nome}</p>
                  <p className="text-xs text-ink/50">
                    {LABEL_TIPO_AGENDAMENTO[a.tipo] ?? a.tipo} ·{" "}
                    {new Date(a.data_hora).toLocaleDateString("pt-BR")}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>
      </section>

      <section className="max-w-3xl mb-10 grid sm:grid-cols-3 gap-4">
        <WidgetNotificacoes notificacoes={notificacoes ?? []} />

        <WidgetCard titulo="Aniversariantes do mês">
          {aniversariantes.length === 0 ? (
            <EstadoVazio texto="Ninguém faz aniversário este mês." />
          ) : (
            <ul className="space-y-1.5">
              {aniversariantes.map((a: any) => (
                <li
                  key={a.id}
                  className="flex items-center gap-2.5 text-sm bg-paper rounded-lg px-3 py-2"
                >
                  <IconGift className="text-accent shrink-0" />
                  <span className="font-medium truncate flex-1">{a.nome}</span>
                  <span className="tabular-nums text-ink/50 shrink-0">
                    {new Date(a.data_nascimento + "T00:00:00").toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </WidgetCard>

        <WidgetCard
          titulo="Tarefas"
          acao={
            <Link href="/professor/tarefas" className="text-xs font-semibold text-accent hover:underline">
              Ver tudo
            </Link>
          }
        >
          <div className="h-full min-h-[6rem] flex flex-col items-center justify-center text-center gap-2">
            <IconDocument className="text-ink/30" />
            <p className="text-sm text-ink/50">Acompanhe entregas pendentes de avaliação.</p>
          </div>
        </WidgetCard>

        <WidgetCard
          titulo="Avisos"
          acao={
            <Link href="/professor/avisos" className="text-xs font-semibold text-accent hover:underline">
              Ver tudo
            </Link>
          }
        >
          <div className="h-full min-h-[6rem] flex flex-col items-center justify-center text-center gap-2">
            <IconMegaphone className="text-ink/30" />
            <p className="text-sm text-ink/50">Publique um comunicado pros seus alunos.</p>
          </div>
        </WidgetCard>
      </section>

      {!primeiraTurma ? (
        <p className="text-sm text-ink/60">
          Você ainda não tem turmas atribuídas. Peça à gestão para vincular
          uma turma ao seu perfil.
        </p>
      ) : (
        <div className="max-w-xl space-y-8">
          <section>
            <h2 className="font-display font-bold text-lg mb-3">
              Nova aula — {primeiraTurma.nome}
            </h2>
            <form action={criarAula} className="flex gap-2 flex-wrap">
              <input type="hidden" name="turma_id" value={primeiraTurma.id} />
              <input
                name="titulo"
                placeholder="Título da aula"
                required
                className="flex-1 min-w-[10rem] rounded-lg border border-line bg-white px-3 py-2 text-sm"
              />
              <input
                name="data"
                type="date"
                required
                className="rounded-lg border border-line bg-white px-3 py-2 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg bg-accent text-white px-4 py-2 text-sm font-semibold hover:-translate-y-px transition-transform"
              >
                Criar aula
              </button>
            </form>
          </section>

          {primeiraAula && (
            <section>
              <h2 className="font-display font-bold text-lg mb-3">
                Chamada — {primeiraAula.titulo} ({primeiraAula.data})
              </h2>
              {alunos.length === 0 ? (
                <p className="text-sm text-ink/60">
                  Nenhum aluno matriculado nesta turma ainda.
                </p>
              ) : (
                <ListaChamada aulaId={primeiraAula.id} alunos={alunos} />
              )}
            </section>
          )}
        </div>
      )}
    </main>
  );
}
