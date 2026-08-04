import { describe, expect, it } from "vitest";
import { gerarParcelas } from "../parcelas";

describe("gerarParcelas", () => {
  it("mensal: gera 1 parcela com o valor total", () => {
    const parcelas = gerarParcelas({
      dataInicio: "2026-03-10",
      diaVencimento: 10,
      numeroParcelas: 1,
      valorTotalCentavos: 15000,
    });

    expect(parcelas).toEqual([{ numero: 1, valorCentavos: 15000, vencimento: "2026-03-10" }]);
  });

  it("semestral: gera 6 parcelas mensais consecutivas", () => {
    const parcelas = gerarParcelas({
      dataInicio: "2026-01-15",
      diaVencimento: 15,
      numeroParcelas: 6,
      valorTotalCentavos: 60000,
    });

    expect(parcelas).toHaveLength(6);
    expect(parcelas.map((p) => p.vencimento)).toEqual([
      "2026-01-15",
      "2026-02-15",
      "2026-03-15",
      "2026-04-15",
      "2026-05-15",
      "2026-06-15",
    ]);
    expect(parcelas.every((p) => p.valorCentavos === 10000)).toBe(true);
  });

  it("anual: gera 12 parcelas e cruza a virada de ano sem caso especial", () => {
    const parcelas = gerarParcelas({
      dataInicio: "2026-08-05",
      diaVencimento: 5,
      numeroParcelas: 12,
      valorTotalCentavos: 120000,
    });

    expect(parcelas).toHaveLength(12);
    expect(parcelas[4].vencimento).toBe("2026-12-05");
    expect(parcelas[5].vencimento).toBe("2027-01-05"); // virada de ano
    expect(parcelas[11].vencimento).toBe("2027-07-05");
  });

  it("mês curto: dia 31 vira o último dia do mês em fevereiro (ano comum)", () => {
    const parcelas = gerarParcelas({
      dataInicio: "2026-01-31",
      diaVencimento: 31,
      numeroParcelas: 3,
      valorTotalCentavos: 300,
    });

    expect(parcelas.map((p) => p.vencimento)).toEqual([
      "2026-01-31",
      "2026-02-28", // 2026 não é bissexto
      "2026-03-31",
    ]);
  });

  it("mês curto: dia 31 vira 29 em fevereiro de ano bissexto", () => {
    const parcelas = gerarParcelas({
      dataInicio: "2028-01-31",
      diaVencimento: 31,
      numeroParcelas: 2,
      valorTotalCentavos: 200,
    });

    expect(parcelas[1].vencimento).toBe("2028-02-29");
  });

  it("mês curto: dia 30 vira 28/29 em fevereiro também", () => {
    const parcelas = gerarParcelas({
      dataInicio: "2026-01-30",
      diaVencimento: 30,
      numeroParcelas: 2,
      valorTotalCentavos: 200,
    });

    expect(parcelas[1].vencimento).toBe("2026-02-28");
  });

  it("distribui o resto do arredondamento na última parcela, somando exatamente o total", () => {
    const parcelas = gerarParcelas({
      dataInicio: "2026-01-10",
      diaVencimento: 10,
      numeroParcelas: 3,
      valorTotalCentavos: 10000, // 10000/3 = 3333.33...
    });

    expect(parcelas.map((p) => p.valorCentavos)).toEqual([3333, 3333, 3334]);
    const soma = parcelas.reduce((acc, p) => acc + p.valorCentavos, 0);
    expect(soma).toBe(10000);
  });

  it("respeita numeroInicial (usado ao editar contrato após parcelas já pagas)", () => {
    const parcelas = gerarParcelas({
      dataInicio: "2026-06-01",
      diaVencimento: 1,
      numeroParcelas: 3,
      valorTotalCentavos: 300,
      numeroInicial: 4,
    });

    expect(parcelas.map((p) => p.numero)).toEqual([4, 5, 6]);
  });

  it("rejeita numeroParcelas menor que 1", () => {
    expect(() =>
      gerarParcelas({ dataInicio: "2026-01-01", diaVencimento: 1, numeroParcelas: 0, valorTotalCentavos: 100 })
    ).toThrow();
  });
});
