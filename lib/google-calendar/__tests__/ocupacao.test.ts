import { describe, expect, it } from "vitest";
import { calcularIntervalosOcupados, type EventoParaOcupacao } from "../ocupacao";

function evento(overrides: Partial<EventoParaOcupacao>): EventoParaOcupacao {
  return {
    title: "Evento",
    startsAt: new Date("2026-08-10T14:00:00Z"),
    endsAt: new Date("2026-08-10T15:00:00Z"),
    isAllDay: false,
    transparency: "opaque",
    status: "confirmed",
    attendeeResponse: null,
    ...overrides,
  };
}

describe("calcularIntervalosOcupados", () => {
  it("mantém evento confirmado e opaco", () => {
    const ocupados = calcularIntervalosOcupados([evento({})], { ignorarDiaInteiro: false });
    expect(ocupados).toHaveLength(1);
  });

  it("ignora evento cancelado", () => {
    const ocupados = calcularIntervalosOcupados([evento({ status: "cancelled" })], {
      ignorarDiaInteiro: false,
    });
    expect(ocupados).toHaveLength(0);
  });

  it("ignora evento marcado como disponível (transparent)", () => {
    const ocupados = calcularIntervalosOcupados([evento({ transparency: "transparent" })], {
      ignorarDiaInteiro: false,
    });
    expect(ocupados).toHaveLength(0);
  });

  it("ignora evento recusado pelo professor", () => {
    const ocupados = calcularIntervalosOcupados([evento({ attendeeResponse: "declined" })], {
      ignorarDiaInteiro: false,
    });
    expect(ocupados).toHaveLength(0);
  });

  it("mantém evento aceito ou sem resposta", () => {
    const ocupados = calcularIntervalosOcupados(
      [evento({ attendeeResponse: "accepted" }), evento({ attendeeResponse: null })],
      { ignorarDiaInteiro: false }
    );
    expect(ocupados).toHaveLength(2);
  });

  it("ignora dia inteiro só quando a conta está configurada pra isso", () => {
    const diaInteiro = evento({ isAllDay: true });
    expect(calcularIntervalosOcupados([diaInteiro], { ignorarDiaInteiro: false })).toHaveLength(1);
    expect(calcularIntervalosOcupados([diaInteiro], { ignorarDiaInteiro: true })).toHaveLength(0);
  });
});
