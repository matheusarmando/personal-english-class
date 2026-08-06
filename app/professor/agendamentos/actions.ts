"use server";

import { revalidatePath } from "next/cache";
import { createClient, getProfile } from "@/lib/supabase/server";
import { GoogleCalendarProvider } from "@/lib/google-calendar/providers/google";
import { converterParaInstanteUTC } from "@/lib/google-calendar/timezone";
import { sincronizarAtualizacaoDaAula, sincronizarCancelamentoDaAula } from "@/lib/google-calendar/escrita";
import { DURACAO_PADRAO_AULA_MINUTOS } from "@/lib/calendario";
import { emailValido, telefoneValido } from "@/lib/validacao";

export type ResultadoAgendamento =
  | { ok: true }
  | { ok: false; conflito: true; tituloConflito: string | null; inicioConflito: string; fimConflito: string }
  | { ok: false; conflito: false; erro: string };

export async function criarAgendamentoAvulso(formData: FormData): Promise<ResultadoAgendamento> {
  const profile = await getProfile();
  if (!profile) return { ok: false, conflito: false, erro: "Não autenticado." };

  const supabase = createClient();
  const nome = formData.get("nome") as string;
  const email = formData.get("email") as string;
  const telefone = formData.get("telefone") as string;
  const tipo = formData.get("tipo") as string;
  const data = formData.get("data") as string;
  const hora = formData.get("hora") as string;
  const observacoes = formData.get("observacoes") as string;
  const forcarAgendamento = formData.get("forcar_agendamento") === "on";

  if (!data || !hora) return { ok: false, conflito: false, erro: "Preencha data e hora." };
  // type="email"/type="tel" no input só ajuda o teclado do navegador —
  // não impede um POST forjado com valor qualquer, daí a checagem aqui.
  if (email && !emailValido(email)) {
    return { ok: false, conflito: false, erro: "E-mail em formato inválido." };
  }
  if (telefone && !telefoneValido(telefone)) {
    return { ok: false, conflito: false, erro: "Telefone em formato inválido." };
  }

  const inicio = converterParaInstanteUTC(data, hora, profile.timezone ?? "America/Sao_Paulo");
  const fim = new Date(inicio.getTime() + DURACAO_PADRAO_AULA_MINUTOS * 60 * 1000);

  if (!forcarAgendamento) {
    const provider = new GoogleCalendarProvider(supabase);
    const { conflito } = await provider.verificarOcupacao(profile.id, inicio, fim);
    if (conflito) {
      return {
        ok: false,
        conflito: true,
        tituloConflito: conflito.titulo,
        inicioConflito: conflito.inicio.toISOString(),
        fimConflito: conflito.fim.toISOString(),
      };
    }
  }

  await supabase.from("agendamentos_avulsos").insert({
    professor_id: profile.id,
    nome,
    email: email || null,
    telefone: telefone || null,
    tipo: tipo || "outro",
    data_hora: inicio.toISOString(),
    observacoes: observacoes || null,
  });

  revalidatePath("/professor/agendamentos");
  revalidatePath("/professor");
  return { ok: true };
}

export async function excluirAgendamentoAvulso(agendamentoId: string) {
  const supabase = createClient();
  await supabase.from("agendamentos_avulsos").delete().eq("id", agendamentoId);
  revalidatePath("/professor/agendamentos");
  revalidatePath("/professor");
}

export async function aprovarSolicitacao(
  solicitacaoId: string,
  formData: FormData
): Promise<ResultadoAgendamento> {
  const supabase = createClient();
  const resposta = ((formData.get("resposta") as string) || "").trim() || null;
  const forcarAgendamento = formData.get("forcar_agendamento") === "on";

  const { data: solicitacao } = await supabase
    .from("solicitacoes_agendamento")
    .select("tipo, aula_horario_id, data_hora_sugerida, professor_id")
    .eq("id", solicitacaoId)
    .single();

  if (!solicitacao) return { ok: false, conflito: false, erro: "Solicitação não encontrada." };

  if (solicitacao.aula_horario_id) {
    if (solicitacao.tipo === "remarcacao" && solicitacao.data_hora_sugerida) {
      const novoInicio = new Date(solicitacao.data_hora_sugerida);
      const novoFim = new Date(novoInicio.getTime() + DURACAO_PADRAO_AULA_MINUTOS * 60 * 1000);

      if (!forcarAgendamento) {
        const provider = new GoogleCalendarProvider(supabase);
        const { conflito } = await provider.verificarOcupacao(solicitacao.professor_id, novoInicio, novoFim);
        if (conflito) {
          return {
            ok: false,
            conflito: true,
            tituloConflito: conflito.titulo,
            inicioConflito: conflito.inicio.toISOString(),
            fimConflito: conflito.fim.toISOString(),
          };
        }
      }

      const { data: horarioAtual } = await supabase
        .from("aluno_horarios")
        .select("google_event_id, google_event_etag, link_aula, alunos(nome, link_aula)")
        .eq("id", solicitacao.aula_horario_id)
        .maybeSingle();

      const { data: professor } = await supabase
        .from("profiles")
        .select("timezone")
        .eq("id", solicitacao.professor_id)
        .single();

      await supabase
        .from("aluno_horarios")
        .update({ data_hora: solicitacao.data_hora_sugerida })
        .eq("id", solicitacao.aula_horario_id);

      const aluno: any = horarioAtual?.alunos;
      if (aluno) {
        await sincronizarAtualizacaoDaAula(
          supabase,
          solicitacao.professor_id,
          {
            aulaId: solicitacao.aula_horario_id,
            tipo: "regular",
            titulo: `Aula com ${aluno.nome}`,
            inicio: novoInicio,
            fim: novoFim,
            timeZone: professor?.timezone ?? "America/Sao_Paulo",
            linkAula: horarioAtual?.link_aula ?? aluno.link_aula,
          },
          horarioAtual?.google_event_id ?? null,
          horarioAtual?.google_event_etag ?? null
        ).catch(() => {});
      }
    } else if (solicitacao.tipo === "cancelamento") {
      const { data: horarioAtual } = await supabase
        .from("aluno_horarios")
        .select("google_event_id")
        .eq("id", solicitacao.aula_horario_id)
        .maybeSingle();

      await supabase
        .from("aluno_horarios")
        .update({ status: "cancelada" })
        .eq("id", solicitacao.aula_horario_id);

      await sincronizarCancelamentoDaAula(
        supabase,
        solicitacao.professor_id,
        horarioAtual?.google_event_id ?? null
      ).catch(() => {});
    }
  }

  await supabase
    .from("solicitacoes_agendamento")
    .update({ status: "aprovada", resposta_professor: resposta, respondida_em: new Date().toISOString() })
    .eq("id", solicitacaoId);

  revalidatePath("/professor/agendamentos");
  revalidatePath("/professor");
  revalidatePath("/aluno");

  return { ok: true };
}

export async function recusarSolicitacao(solicitacaoId: string, formData: FormData) {
  const supabase = createClient();
  const resposta = ((formData.get("resposta") as string) || "").trim() || null;

  await supabase
    .from("solicitacoes_agendamento")
    .update({ status: "recusada", resposta_professor: resposta, respondida_em: new Date().toISOString() })
    .eq("id", solicitacaoId);

  revalidatePath("/professor/agendamentos");
  revalidatePath("/aluno");
}
