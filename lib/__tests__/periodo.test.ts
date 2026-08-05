import { describe, expect, it } from "vitest";
import { periodoMesAtual } from "../periodo";

describe("periodoMesAtual", () => {
  it("devolve o primeiro e o último dia do mês", () => {
    expect(periodoMesAtual(new Date(2026, 7, 15))).toEqual({ de: "2026-08-01", ate: "2026-08-31" });
  });

  it("lida com fevereiro", () => {
    expect(periodoMesAtual(new Date(2026, 1, 10))).toEqual({ de: "2026-02-01", ate: "2026-02-28" });
  });

  it("lida com dezembro (virada de ano)", () => {
    expect(periodoMesAtual(new Date(2026, 11, 5))).toEqual({ de: "2026-12-01", ate: "2026-12-31" });
  });
});
