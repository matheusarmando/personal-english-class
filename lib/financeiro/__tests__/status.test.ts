import { describe, expect, it } from "vitest";
import { statusEfetivo } from "../status";

describe("statusEfetivo", () => {
  const hoje = new Date(2026, 7, 15); // 15/08/2026 (mês 0-based)

  it("pendente com vencimento futuro continua pendente", () => {
    expect(statusEfetivo({ status: "pendente", vencimento: "2026-08-20" }, hoje)).toBe("pendente");
  });

  it("pendente com vencimento hoje continua pendente (só atrasa no dia seguinte)", () => {
    expect(statusEfetivo({ status: "pendente", vencimento: "2026-08-15" }, hoje)).toBe("pendente");
  });

  it("pendente com vencimento passado vira atrasada", () => {
    expect(statusEfetivo({ status: "pendente", vencimento: "2026-08-01" }, hoje)).toBe("atrasada");
  });

  it("paga nunca vira atrasada mesmo com vencimento passado", () => {
    expect(statusEfetivo({ status: "paga", vencimento: "2026-01-01" }, hoje)).toBe("paga");
  });

  it("cancelada nunca vira atrasada", () => {
    expect(statusEfetivo({ status: "cancelada", vencimento: "2026-01-01" }, hoje)).toBe("cancelada");
  });
});
