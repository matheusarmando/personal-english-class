import { describe, expect, it } from "vitest";
import { aplicarMascaraTelefone } from "../telefone";

describe("aplicarMascaraTelefone", () => {
  it("formata progressivamente enquanto digita", () => {
    expect(aplicarMascaraTelefone("1")).toBe("(1");
    expect(aplicarMascaraTelefone("11")).toBe("(11");
    expect(aplicarMascaraTelefone("119")).toBe("(11) 9");
    expect(aplicarMascaraTelefone("119999")).toBe("(11) 9999");
    expect(aplicarMascaraTelefone("1199999999")).toBe("(11) 9999-9999");
    expect(aplicarMascaraTelefone("11999999999")).toBe("(11) 99999-9999");
  });

  it("aceita colar um número já formatado sem duplicar caracteres", () => {
    expect(aplicarMascaraTelefone("(11) 99999-9999")).toBe("(11) 99999-9999");
    expect(aplicarMascaraTelefone("(11) 3333-4444")).toBe("(11) 3333-4444");
  });

  it("ignora dígitos além do 11º", () => {
    expect(aplicarMascaraTelefone("119999999999999")).toBe("(11) 99999-9999");
  });

  it("retorna vazio pra entrada vazia", () => {
    expect(aplicarMascaraTelefone("")).toBe("");
  });

  it("ignora letras e outros caracteres não numéricos", () => {
    expect(aplicarMascaraTelefone("abc11def999999999")).toBe("(11) 99999-9999");
  });
});
