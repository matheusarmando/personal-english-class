import type { EventoGooglePayload } from "./tipos";
import { CHAVE_MARCADOR_AULA } from "./constantes";

const COR_AULA_REGULAR = "9"; // Blueberry
const COR_AGENDAMENTO_AVULSO = "6"; // Tangerine

export type AulaParaEvento = {
  /** Id da linha em aluno_horarios (ou agendamentos_avulsos) — vira o marcador de idempotência. */
  aulaId: string;
  tipo: "regular" | "avulso";
  titulo: string;
  descricao?: string | null;
  /** Instante UTC preciso — já convertido via converterParaInstanteUTC. */
  inicio: Date;
  fim: Date;
  /** profiles.timezone do professor. */
  timeZone: string;
  linkAula?: string | null;
};

/**
 * Monta o payload do evento a partir de uma aula do app — função
 * pura e testável, sem chamar a API. O marcador em
 * `extendedProperties.private` é o que permite: (1) idempotência na
 * criação (reconciliação via buscarEventoPorPropriedade antes de
 * criar) e (2) excluir o próprio evento da checagem de ocupação
 * (ocupacao.ts) quando ele volta pelo sync de leitura.
 */
export function construirPayloadEvento(aula: AulaParaEvento): EventoGooglePayload {
  const linhasDescricao: string[] = [];
  if (aula.descricao) linhasDescricao.push(aula.descricao);
  if (aula.linkAula) linhasDescricao.push(`🎥 Link da aula: ${aula.linkAula}`);
  linhasDescricao.push("Agendado via Personal Class.");

  return {
    summary: aula.titulo,
    description: linhasDescricao.join("\n\n"),
    start: { dateTime: aula.inicio.toISOString(), timeZone: aula.timeZone },
    end: { dateTime: aula.fim.toISOString(), timeZone: aula.timeZone },
    colorId: aula.tipo === "avulso" ? COR_AGENDAMENTO_AVULSO : COR_AULA_REGULAR,
    extendedProperties: {
      private: { [CHAVE_MARCADOR_AULA]: aula.aulaId, appOrigem: "personal-class" },
    },
    reminders: { useDefault: true },
  };
}
