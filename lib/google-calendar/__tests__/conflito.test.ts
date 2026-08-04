import { describe, expect, it } from "vitest";
import { encontrarConflito } from "../conflito";
import type { IntervaloOcupado } from "../tipos";

function intervalo(inicioISO: string, fimISO: string, titulo = "Evento"): IntervaloOcupado {
  return { titulo, inicio: new Date(inicioISO), fim: new Date(fimISO) };
}

describe("encontrarConflito", () => {
  it("detecta sobreposição total", () => {
    const intervalos = [intervalo("2026-08-10T14:00:00Z", "2026-08-10T15:00:00Z")];
    const conflito = encontrarConflito(intervalos, new Date("2026-08-10T14:00:00Z"), new Date("2026-08-10T15:00:00Z"));
    expect(conflito).not.toBeNull();
  });

  it("detecta sobreposição parcial no início", () => {
    const intervalos = [intervalo("2026-08-10T14:00:00Z", "2026-08-10T15:00:00Z")];
    const conflito = encontrarConflito(intervalos, new Date("2026-08-10T13:30:00Z"), new Date("2026-08-10T14:30:00Z"));
    expect(conflito).not.toBeNull();
  });

  it("detecta sobreposição parcial no fim", () => {
    const intervalos = [intervalo("2026-08-10T14:00:00Z", "2026-08-10T15:00:00Z")];
    const conflito = encontrarConflito(intervalos, new Date("2026-08-10T14:30:00Z"), new Date("2026-08-10T15:30:00Z"));
    expect(conflito).not.toBeNull();
  });

  it("detecta quando o novo horário engloba o evento existente", () => {
    const intervalos = [intervalo("2026-08-10T14:00:00Z", "2026-08-10T14:30:00Z")];
    const conflito = encontrarConflito(intervalos, new Date("2026-08-10T13:00:00Z"), new Date("2026-08-10T16:00:00Z"));
    expect(conflito).not.toBeNull();
  });

  it("evento adjacente (fim do novo === início do existente) NÃO é conflito", () => {
    const intervalos = [intervalo("2026-08-10T15:00:00Z", "2026-08-10T16:00:00Z")];
    const conflito = encontrarConflito(intervalos, new Date("2026-08-10T14:00:00Z"), new Date("2026-08-10T15:00:00Z"));
    expect(conflito).toBeNull();
  });

  it("evento adjacente (início do novo === fim do existente) NÃO é conflito", () => {
    const intervalos = [intervalo("2026-08-10T13:00:00Z", "2026-08-10T14:00:00Z")];
    const conflito = encontrarConflito(intervalos, new Date("2026-08-10T14:00:00Z"), new Date("2026-08-10T15:00:00Z"));
    expect(conflito).toBeNull();
  });

  it("sem sobreposição nenhuma não é conflito", () => {
    const intervalos = [intervalo("2026-08-10T09:00:00Z", "2026-08-10T10:00:00Z")];
    const conflito = encontrarConflito(intervalos, new Date("2026-08-10T14:00:00Z"), new Date("2026-08-10T15:00:00Z"));
    expect(conflito).toBeNull();
  });

  it("virada de dia: evento que cruza meia-noite conflita com aula logo após 00:00", () => {
    const intervalos = [intervalo("2026-08-10T23:00:00Z", "2026-08-11T01:00:00Z")];
    const conflito = encontrarConflito(intervalos, new Date("2026-08-11T00:30:00Z"), new Date("2026-08-11T01:30:00Z"));
    expect(conflito).not.toBeNull();
  });

  it("virada de fuso: horário local 21h em UTC-3 (00h UTC do dia seguinte) compara corretamente", () => {
    // 2026-08-10 21:00 America/Sao_Paulo (UTC-3) === 2026-08-11 00:00 UTC
    const inicioLocal = new Date("2026-08-10T21:00:00-03:00");
    const fimLocal = new Date("2026-08-10T22:00:00-03:00");
    const intervalos = [intervalo("2026-08-11T00:00:00Z", "2026-08-11T01:00:00Z")];
    const conflito = encontrarConflito(intervalos, inicioLocal, fimLocal);
    expect(conflito).not.toBeNull();
  });

  it("devolve o primeiro intervalo conflitante quando há vários", () => {
    const intervalos = [
      intervalo("2026-08-10T09:00:00Z", "2026-08-10T10:00:00Z", "Manhã"),
      intervalo("2026-08-10T14:00:00Z", "2026-08-10T15:00:00Z", "Tarde"),
    ];
    const conflito = encontrarConflito(intervalos, new Date("2026-08-10T14:15:00Z"), new Date("2026-08-10T14:45:00Z"));
    expect(conflito?.titulo).toBe("Tarde");
  });
});
