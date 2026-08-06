import { describe, expect, it } from "vitest";
import { extrairDdiENumero } from "../ddi";

describe("extrairDdiENumero", () => {
  it("separa DDI + numero quando o valor ja tem o prefixo", () => {
    expect(extrairDdiENumero("+55 (11) 99999-9999")).toEqual({ ddi: "55", numero: "(11) 99999-9999" });
    expect(extrairDdiENumero("+1 (305) 555-0100")).toEqual({ ddi: "1", numero: "(305) 555-0100" });
  });

  it("cai no default Brasil pra dado legado sem prefixo", () => {
    expect(extrairDdiENumero("(11) 99999-9999")).toEqual({ ddi: "55", numero: "(11) 99999-9999" });
  });

  it("cai no default Brasil se o codigo nao esta na lista suportada", () => {
    expect(extrairDdiENumero("+999 (11) 99999-9999")).toEqual({ ddi: "55", numero: "+999 (11) 99999-9999" });
  });

  it("trata valor vazio ou nulo", () => {
    expect(extrairDdiENumero("")).toEqual({ ddi: "55", numero: "" });
    expect(extrairDdiENumero(null)).toEqual({ ddi: "55", numero: "" });
    expect(extrairDdiENumero(undefined)).toEqual({ ddi: "55", numero: "" });
  });
});
