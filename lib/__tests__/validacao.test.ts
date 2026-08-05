import { describe, expect, it } from "vitest";
import { emailValido, senhaValida, telefoneValido } from "../validacao";

describe("emailValido", () => {
  it("aceita e-mails bem formados", () => {
    expect(emailValido("aluno@example.com")).toBe(true);
    expect(emailValido(" aluno@example.com ")).toBe(true);
  });

  it("rejeita e-mails mal formados", () => {
    expect(emailValido("aluno@")).toBe(false);
    expect(emailValido("aluno@example")).toBe(false);
    expect(emailValido("aluno em maiuscula")).toBe(false);
    expect(emailValido("")).toBe(false);
  });
});

describe("telefoneValido", () => {
  it("aceita DDD + numero, formatado ou nao", () => {
    expect(telefoneValido("11999999999")).toBe(true);
    expect(telefoneValido("(11) 99999-9999")).toBe(true);
    expect(telefoneValido("1133334444")).toBe(true);
  });

  it("aceita com codigo do pais 55", () => {
    expect(telefoneValido("+55 11 99999-9999")).toBe(true);
  });

  it("rejeita numero curto demais ou letras", () => {
    expect(telefoneValido("12345")).toBe(false);
    expect(telefoneValido("abc")).toBe(false);
    expect(telefoneValido("")).toBe(false);
  });
});

describe("senhaValida", () => {
  it("rejeita senhas fracas", () => {
    expect(senhaValida("123456")).toBe(false);
    expect(senhaValida("semnumero")).toBe(false);
    expect(senhaValida("SEMMINUSCULA1")).toBe(true); // maiuscula+numero+8+ ja basta pela regra
    expect(senhaValida("semmaiuscula1")).toBe(false);
    expect(senhaValida("Curta1")).toBe(false);
  });

  it("aceita senha que cumpre a regra", () => {
    expect(senhaValida("Senha1234")).toBe(true);
  });

  it("rejeita senha maior que 60 caracteres", () => {
    expect(senhaValida("A1" + "a".repeat(60))).toBe(false);
  });
});
