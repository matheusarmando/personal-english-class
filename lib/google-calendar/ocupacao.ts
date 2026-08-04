import type { IntervaloOcupado } from "./tipos";

export type EventoParaOcupacao = {
  title: string | null;
  startsAt: Date;
  endsAt: Date;
  isAllDay: boolean;
  transparency: string;
  status: string;
  attendeeResponse: string | null;
};

/**
 * Aplica as regras do requisito 1.4: cancelado, marcado como
 * "disponível" (transparent) e recusado pelo professor nunca contam
 * como ocupado. Dia inteiro é configurável por conta. Função pura —
 * recorrência já vem expandida em instâncias pelo sync
 * (`singleEvents=true` na chamada à API).
 */
export function calcularIntervalosOcupados(
  eventos: EventoParaOcupacao[],
  config: { ignorarDiaInteiro: boolean }
): IntervaloOcupado[] {
  return eventos
    .filter((e) => e.status !== "cancelled")
    .filter((e) => e.transparency !== "transparent")
    .filter((e) => e.attendeeResponse !== "declined")
    .filter((e) => !(config.ignorarDiaInteiro && e.isAllDay))
    .map((e) => ({ titulo: e.title, inicio: e.startsAt, fim: e.endsAt }));
}
