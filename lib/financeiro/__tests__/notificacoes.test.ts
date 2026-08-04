import { describe, expect, it } from "vitest";
import { decidirNotificacoes, type ParcelaParaNotificar } from "../notificacoes";

const hoje = new Date(2026, 7, 15); // 15/08/2026

function parcela(overrides: Partial<ParcelaParaNotificar>): ParcelaParaNotificar {
  return {
    id: "parcela-1",
    numero: 1,
    vencimento: "2026-08-15",
    status: "pendente",
    alunoProfileId: "aluno-1",
    professorId: "professor-1",
    professorDiasLembrete: 3,
    ...overrides,
  };
}

describe("decidirNotificacoes", () => {
  it("gera 'a vencer' pro aluno exatamente N dias antes (N = professorDiasLembrete)", () => {
    const notifs = decidirNotificacoes([parcela({ vencimento: "2026-08-18" })], hoje);
    expect(notifs.some((n) => n.tipo === "parcela_a_vencer" && n.destinatarioId === "aluno-1")).toBe(true);
  });

  it("não gera 'a vencer' fora da janela de dias configurada", () => {
    const notifs = decidirNotificacoes([parcela({ vencimento: "2026-08-25" })], hoje);
    expect(notifs.some((n) => n.tipo === "parcela_a_vencer")).toBe(false);
  });

  it("gera 'vence hoje' quando o vencimento é a data de referência", () => {
    const notifs = decidirNotificacoes([parcela({ vencimento: "2026-08-15" })], hoje);
    expect(notifs.some((n) => n.tipo === "parcela_vence_hoje")).toBe(true);
  });

  it("gera 'atrasada' pro aluno quando o vencimento já passou", () => {
    const notifs = decidirNotificacoes([parcela({ vencimento: "2026-08-01" })], hoje);
    const atraso = notifs.find((n) => n.tipo === "parcela_atrasada");
    expect(atraso).toBeDefined();
    expect(atraso?.chaveIdempotencia).toBe("parcela_atrasada:parcela-1");
  });

  it("chave de idempotência de 'atrasada' não muda dia a dia (evita reenviar todo dia)", () => {
    const ontem = new Date(2026, 7, 14);
    const chaveHoje = decidirNotificacoes([parcela({ vencimento: "2026-08-01" })], hoje).find(
      (n) => n.tipo === "parcela_atrasada"
    )?.chaveIdempotencia;
    const chaveOntem = decidirNotificacoes([parcela({ vencimento: "2026-08-01" })], ontem).find(
      (n) => n.tipo === "parcela_atrasada"
    )?.chaveIdempotencia;
    expect(chaveHoje).toBe(chaveOntem);
  });

  it("não notifica parcela já paga ou cancelada", () => {
    const notifs = decidirNotificacoes(
      [parcela({ vencimento: "2026-08-01", status: "paga" }), parcela({ vencimento: "2026-08-01", status: "cancelada", id: "parcela-2" })],
      hoje
    );
    expect(notifs.filter((n) => n.destinatarioId === "aluno-1")).toHaveLength(0);
  });

  it("não notifica o aluno quando a parcela não tem profile vinculado", () => {
    const notifs = decidirNotificacoes([parcela({ vencimento: "2026-08-15", alunoProfileId: null })], hoje);
    expect(notifs.some((n) => n.destinatarioId === "aluno-1")).toBe(false);
  });

  it("gera resumo pro professor agregando vencendo (7 dias) e novas atrasadas (venceu ontem)", () => {
    const notifs = decidirNotificacoes(
      [
        parcela({ id: "p1", vencimento: "2026-08-16" }), // vence em 1 dia -> conta em "vencendo"
        parcela({ id: "p2", vencimento: "2026-08-14" }), // venceu ontem -> nova atrasada
      ],
      hoje
    );

    const resumo = notifs.find((n) => n.tipo === "resumo_professor_vencimentos");
    expect(resumo).toBeDefined();
    expect(resumo?.mensagem).toContain("1 parcela(s) vencendo");
    expect(resumo?.mensagem).toContain("1 nova(s) em atraso");
    expect(resumo?.chaveIdempotencia).toBe("resumo_professor:professor-1:2026-08-15");
  });

  it("não gera resumo pro professor quando não há nada relevante", () => {
    const notifs = decidirNotificacoes([parcela({ vencimento: "2026-12-25" })], hoje);
    expect(notifs.some((n) => n.tipo === "resumo_professor_vencimentos")).toBe(false);
  });
});
