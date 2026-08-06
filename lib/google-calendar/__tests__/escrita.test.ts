import { describe, expect, it } from "vitest";
import { calcularProximoStatusTentativa } from "../escrita";

describe("calcularProximoStatusTentativa", () => {
  it("fica 'pendente' e incrementa enquanto não atinge o máximo", () => {
    expect(calcularProximoStatusTentativa(0)).toEqual({ status: "pendente", tentativas: 1 });
    expect(calcularProximoStatusTentativa(1)).toEqual({ status: "pendente", tentativas: 2 });
    expect(calcularProximoStatusTentativa(3)).toEqual({ status: "pendente", tentativas: 4 });
  });

  it("vira 'falhou' exatamente na 5ª tentativa, não antes", () => {
    expect(calcularProximoStatusTentativa(3)).toEqual({ status: "pendente", tentativas: 4 });
    expect(calcularProximoStatusTentativa(4)).toEqual({ status: "falhou", tentativas: 5 });
  });

  it("permanece 'falhou' se chamado de novo por engano depois do limite", () => {
    expect(calcularProximoStatusTentativa(5)).toEqual({ status: "falhou", tentativas: 6 });
  });
});
