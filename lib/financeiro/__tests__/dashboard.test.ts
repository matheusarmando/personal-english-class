import { describe, expect, it } from "vitest";
import { calcularTotaisDashboard, type ContratoParaDashboard, type ParcelaParaDashboard } from "../dashboard";

const hoje = new Date(2026, 7, 15); // 15/08/2026

const contratos: ContratoParaDashboard[] = [
  { id: "c1", alunoId: "a1", tipoPlano: "mensal", dataInicio: "2026-08-01", numeroParcelas: 1 },
  { id: "c2", alunoId: "a2", tipoPlano: "semestral", dataInicio: "2026-06-01", numeroParcelas: 6 },
];

describe("calcularTotaisDashboard", () => {
  it("soma o previsto e o recebido do mês corrente", () => {
    const parcelas: ParcelaParaDashboard[] = [
      { contratoId: "c1", valorCentavos: 10000, valorPagoCentavos: 10000, vencimento: "2026-08-10", status: "paga" },
      { contratoId: "c2", valorCentavos: 20000, valorPagoCentavos: null, vencimento: "2026-08-20", status: "pendente" },
    ];

    const totais = calcularTotaisDashboard(parcelas, contratos, hoje);

    expect(totais.previstoNoMesCentavos).toBe(30000);
    expect(totais.recebidoNoMesCentavos).toBe(10000);
  });

  it("calcula inadimplência a partir do status efetivo (não da coluna crua)", () => {
    const parcelas: ParcelaParaDashboard[] = [
      { contratoId: "c1", valorCentavos: 15000, valorPagoCentavos: null, vencimento: "2026-07-01", status: "pendente" },
    ];

    const totais = calcularTotaisDashboard(parcelas, contratos, hoje);

    expect(totais.inadimplencia).toEqual({ totalCentavos: 15000, quantidadeParcelas: 1 });
  });

  it("distribui a previsão de receita pelos próximos meses", () => {
    const parcelas: ParcelaParaDashboard[] = [
      { contratoId: "c1", valorCentavos: 10000, valorPagoCentavos: null, vencimento: "2026-08-10", status: "pendente" },
      { contratoId: "c2", valorCentavos: 10000, valorPagoCentavos: null, vencimento: "2026-09-10", status: "pendente" },
      { contratoId: "c2", valorCentavos: 10000, valorPagoCentavos: null, vencimento: "2027-06-10", status: "pendente" }, // fora da janela de 6 meses
    ];

    const totais = calcularTotaisDashboard(parcelas, contratos, hoje, 6);

    expect(totais.previsaoReceitaPorMes).toHaveLength(6);
    expect(totais.previsaoReceitaPorMes[0]).toEqual({ mes: "2026-08", totalCentavos: 10000 });
    expect(totais.previsaoReceitaPorMes[1]).toEqual({ mes: "2026-09", totalCentavos: 10000 });
    expect(totais.previsaoReceitaPorMes.reduce((acc, m) => acc + m.totalCentavos, 0)).toBe(20000);
  });

  it("ignora parcela cancelada na previsão e no previsto do mês", () => {
    const parcelas: ParcelaParaDashboard[] = [
      { contratoId: "c1", valorCentavos: 10000, valorPagoCentavos: null, vencimento: "2026-08-10", status: "cancelada" },
    ];

    const totais = calcularTotaisDashboard(parcelas, contratos, hoje);

    expect(totais.previstoNoMesCentavos).toBe(0);
    expect(totais.previsaoReceitaPorMes[0].totalCentavos).toBe(0);
  });

  it("calcula ticket médio por plano só com parcelas pagas", () => {
    const parcelas: ParcelaParaDashboard[] = [
      { contratoId: "c2", valorCentavos: 10000, valorPagoCentavos: 10000, vencimento: "2026-06-01", status: "paga" },
      { contratoId: "c2", valorCentavos: 10000, valorPagoCentavos: 8000, vencimento: "2026-07-01", status: "paga" },
    ];

    const totais = calcularTotaisDashboard(parcelas, contratos, hoje);

    expect(totais.ticketMedioPorPlano.semestral).toBe(9000);
    expect(totais.ticketMedioPorPlano.mensal).toBe(0);
  });

  it("identifica contratos perto do fim (<= 2 parcelas em aberto)", () => {
    const parcelas: ParcelaParaDashboard[] = [
      { contratoId: "c2", valorCentavos: 10000, valorPagoCentavos: null, vencimento: "2026-08-20", status: "pendente" },
      { contratoId: "c2", valorCentavos: 10000, valorPagoCentavos: null, vencimento: "2026-09-20", status: "pendente" },
      { contratoId: "c1", valorCentavos: 10000, valorPagoCentavos: null, vencimento: "2026-08-10", status: "pendente" },
    ];

    const totais = calcularTotaisDashboard(parcelas, contratos, hoje);

    expect(totais.contratosPertoDoFim.sort()).toEqual(["c1", "c2"]);
  });
});
