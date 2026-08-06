import { describe, expect, it } from "vitest";
import { calcularRelatorioFinanceiro, type ContratoRelatorio, type ParcelaRelatorio } from "../relatorio";

const hoje = new Date(2026, 7, 15); // 15/08/2026

describe("calcularRelatorioFinanceiro", () => {
  it("soma previsto e recebido só das parcelas dentro do período", () => {
    const parcelas: ParcelaRelatorio[] = [
      { contratoId: "c1", valorCentavos: 10000, valorPagoCentavos: 10000, vencimento: "2026-08-10", status: "paga" },
      { contratoId: "c2", valorCentavos: 20000, valorPagoCentavos: null, vencimento: "2026-09-01", status: "pendente" },
    ];

    const resultado = calcularRelatorioFinanceiro(parcelas, [], "2026-08-01", "2026-08-31", hoje);

    expect(resultado.previstoCentavos).toBe(10000);
    expect(resultado.recebidoCentavos).toBe(10000);
    expect(resultado.quantidadeParcelasPagas).toBe(1);
  });

  it("calcula inadimplência a partir do status efetivo dentro do período", () => {
    const parcelas: ParcelaRelatorio[] = [
      { contratoId: "c1", valorCentavos: 15000, valorPagoCentavos: null, vencimento: "2026-07-20", status: "pendente" },
    ];

    const resultado = calcularRelatorioFinanceiro(parcelas, [], "2026-07-01", "2026-07-31", hoje);

    expect(resultado.inadimplenciaCentavos).toBe(15000);
    expect(resultado.quantidadeParcelasInadimplentes).toBe(1);
  });

  it("ignora parcela cancelada", () => {
    const parcelas: ParcelaRelatorio[] = [
      { contratoId: "c1", valorCentavos: 15000, valorPagoCentavos: null, vencimento: "2026-08-10", status: "cancelada" },
    ];

    const resultado = calcularRelatorioFinanceiro(parcelas, [], "2026-08-01", "2026-08-31", hoje);

    expect(resultado.previstoCentavos).toBe(0);
  });

  it("conta contratos novos iniciados dentro do período", () => {
    const contratos: ContratoRelatorio[] = [
      { id: "c1", dataInicio: "2026-08-05" },
      { id: "c2", dataInicio: "2026-07-20" },
    ];

    const resultado = calcularRelatorioFinanceiro([], contratos, "2026-08-01", "2026-08-31", hoje);

    expect(resultado.contratosNovos).toBe(1);
  });
});
