import { describe, expect, it } from "vitest";
import { converterParaInstanteUTC } from "../timezone";

describe("converterParaInstanteUTC", () => {
  it("converte horário de São Paulo (UTC-3) pro instante UTC correto", () => {
    const instante = converterParaInstanteUTC("2026-08-10", "14:00", "America/Sao_Paulo");
    expect(instante.toISOString()).toBe("2026-08-10T17:00:00.000Z");
  });

  it("converte horário que vira o dia em UTC", () => {
    // 22:00 em São Paulo (UTC-3) = 01:00 UTC do dia seguinte.
    const instante = converterParaInstanteUTC("2026-08-10", "22:00", "America/Sao_Paulo");
    expect(instante.toISOString()).toBe("2026-08-11T01:00:00.000Z");
  });

  it("UTC como timezone não desloca nada", () => {
    const instante = converterParaInstanteUTC("2026-08-10", "14:00", "UTC");
    expect(instante.toISOString()).toBe("2026-08-10T14:00:00.000Z");
  });

  it("timezone com offset positivo (Ásia/Tóquio, UTC+9)", () => {
    const instante = converterParaInstanteUTC("2026-08-10", "09:00", "Asia/Tokyo");
    expect(instante.toISOString()).toBe("2026-08-10T00:00:00.000Z");
  });
});
