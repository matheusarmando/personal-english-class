import { describe, expect, it } from "vitest";
import { construirPayloadEvento, type AulaParaEvento } from "../eventos-para-google";

function aula(overrides: Partial<AulaParaEvento> = {}): AulaParaEvento {
  return {
    aulaId: "aula-123",
    tipo: "regular",
    titulo: "Aula com Maria",
    inicio: new Date("2026-08-10T14:00:00Z"),
    fim: new Date("2026-08-10T15:00:00Z"),
    timeZone: "America/Sao_Paulo",
    ...overrides,
  };
}

describe("construirPayloadEvento", () => {
  it("monta o payload básico com o marcador de idempotência", () => {
    const payload = construirPayloadEvento(aula());

    expect(payload.summary).toBe("Aula com Maria");
    expect(payload.start).toEqual({ dateTime: "2026-08-10T14:00:00.000Z", timeZone: "America/Sao_Paulo" });
    expect(payload.end).toEqual({ dateTime: "2026-08-10T15:00:00.000Z", timeZone: "America/Sao_Paulo" });
    expect(payload.extendedProperties?.private.appAulaId).toBe("aula-123");
    expect(payload.reminders).toEqual({ useDefault: true });
  });

  it("usa cor diferente pra aula regular e agendamento avulso", () => {
    const regular = construirPayloadEvento(aula({ tipo: "regular" }));
    const avulso = construirPayloadEvento(aula({ tipo: "avulso" }));

    expect(regular.colorId).not.toBe(avulso.colorId);
  });

  it("inclui o link da aula na descrição quando presente", () => {
    const payload = construirPayloadEvento(aula({ linkAula: "https://meet.google.com/abc-defg-hij" }));
    expect(payload.description).toContain("https://meet.google.com/abc-defg-hij");
  });

  it("não inclui linha de link quando não há link", () => {
    const payload = construirPayloadEvento(aula({ linkAula: null }));
    expect(payload.description).not.toContain("Link da aula");
  });

  it("sempre inclui a assinatura da plataforma na descrição", () => {
    const payload = construirPayloadEvento(aula());
    expect(payload.description).toContain("Agendado via Personal Class.");
  });

  it("inclui observações quando presentes", () => {
    const payload = construirPayloadEvento(aula({ descricao: "Revisar lição de casa" }));
    expect(payload.description).toContain("Revisar lição de casa");
  });
});
