import { statusEfetivo } from "./status";
import type { StatusParcelaArmazenado } from "./tipos";

export type TipoNotificacao =
  | "parcela_a_vencer"
  | "parcela_vence_hoje"
  | "parcela_atrasada"
  | "resumo_professor_vencimentos";

export type ParcelaParaNotificar = {
  id: string;
  numero: number;
  vencimento: string;
  status: StatusParcelaArmazenado;
  alunoProfileId: string | null;
  professorId: string;
  professorDiasLembrete: number;
};

export type NotificacaoParaCriar = {
  destinatarioId: string;
  tipo: TipoNotificacao;
  parcelaId: string | null;
  titulo: string;
  mensagem: string;
  /** Único no banco — garante que a mesma notificação nunca é criada
   * duas vezes, sem precisar checar "já existe?" antes de inserir. */
  chaveIdempotencia: string;
};

/**
 * Decide quais notificações (in-app e WhatsApp usam a mesma decisão)
 * precisam existir hoje, a partir do conjunto de parcelas pendentes.
 * Função pura, chamada 1x/dia pelo cron.
 *
 * - Aluno recebe "a vencer" (uma vez, N dias antes — N configurável
 *   por professor), "vence hoje" (uma vez) e "atrasada" (uma vez, no
 *   primeiro dia em atraso — não repete diariamente pra não virar spam).
 * - Professor recebe um resumo diário agregando o que vence nos
 *   próximos 7 dias e o que ficou atrasado desde ontem.
 */
export function decidirNotificacoes(
  parcelas: ParcelaParaNotificar[],
  hoje: Date = new Date()
): NotificacaoParaCriar[] {
  const hojeISO = paraDataISO(hoje);
  const notificacoes: NotificacaoParaCriar[] = [];
  const resumoPorProfessor = new Map<string, { vencendo: number; novasAtrasadas: number }>();

  for (const parcela of parcelas) {
    if (parcela.status !== "pendente") continue;

    const diasParaVencer = diferencaDias(parcela.vencimento, hojeISO);
    const efetivo = statusEfetivo({ status: parcela.status, vencimento: parcela.vencimento }, hoje);

    if (parcela.alunoProfileId) {
      if (efetivo === "pendente" && diasParaVencer === parcela.professorDiasLembrete) {
        notificacoes.push({
          destinatarioId: parcela.alunoProfileId,
          tipo: "parcela_a_vencer",
          parcelaId: parcela.id,
          titulo: "Parcela a vencer",
          mensagem: `Sua parcela ${parcela.numero} vence em ${parcela.professorDiasLembrete} dia(s), no dia ${formatarDataBR(parcela.vencimento)}.`,
          chaveIdempotencia: `parcela_a_vencer:${parcela.id}`,
        });
      }

      if (efetivo === "pendente" && diasParaVencer === 0) {
        notificacoes.push({
          destinatarioId: parcela.alunoProfileId,
          tipo: "parcela_vence_hoje",
          parcelaId: parcela.id,
          titulo: "Parcela vence hoje",
          mensagem: `Sua parcela ${parcela.numero} vence hoje.`,
          chaveIdempotencia: `parcela_vence_hoje:${parcela.id}`,
        });
      }

      if (efetivo === "atrasada") {
        notificacoes.push({
          destinatarioId: parcela.alunoProfileId,
          tipo: "parcela_atrasada",
          parcelaId: parcela.id,
          titulo: "Parcela atrasada",
          mensagem: `Sua parcela ${parcela.numero} está atrasada desde ${formatarDataBR(parcela.vencimento)}.`,
          chaveIdempotencia: `parcela_atrasada:${parcela.id}`,
        });
      }
    }

    const resumo = resumoPorProfessor.get(parcela.professorId) ?? { vencendo: 0, novasAtrasadas: 0 };
    if (efetivo === "pendente" && diasParaVencer >= 0 && diasParaVencer <= 7) {
      resumo.vencendo += 1;
    }
    if (efetivo === "atrasada" && diasParaVencer === -1) {
      resumo.novasAtrasadas += 1;
    }
    resumoPorProfessor.set(parcela.professorId, resumo);
  }

  for (const [professorId, resumo] of resumoPorProfessor) {
    if (resumo.vencendo === 0 && resumo.novasAtrasadas === 0) continue;
    notificacoes.push({
      destinatarioId: professorId,
      tipo: "resumo_professor_vencimentos",
      parcelaId: null,
      titulo: "Resumo financeiro do dia",
      mensagem: `${resumo.vencendo} parcela(s) vencendo nos próximos 7 dias, ${resumo.novasAtrasadas} nova(s) em atraso.`,
      chaveIdempotencia: `resumo_professor:${professorId}:${hojeISO}`,
    });
  }

  return notificacoes;
}

function diferencaDias(dataA: string, dataB: string): number {
  const a = new Date(`${dataA}T00:00:00Z`).getTime();
  const b = new Date(`${dataB}T00:00:00Z`).getTime();
  return Math.round((a - b) / 86400000);
}

function paraDataISO(data: Date): string {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarDataBR(dataISO: string): string {
  const [ano, mes, dia] = dataISO.split("-");
  return `${dia}/${mes}/${ano}`;
}
