import { beforeAll, describe, expect, it } from "vitest";

beforeAll(() => {
  process.env.GOOGLE_CLIENT_SECRET = "segredo-de-teste";
});

describe("gerarEstado / validarEstado", () => {
  it("valida um state recém-gerado", async () => {
    const { gerarEstado, validarEstado } = await import("../oauth-state");
    const state = gerarEstado("professor-123");
    const resultado = validarEstado(state);
    expect(resultado).toEqual({ valido: true, professorId: "professor-123" });
  });

  it("rejeita state com assinatura adulterada", async () => {
    const { gerarEstado, validarEstado } = await import("../oauth-state");
    const state = gerarEstado("professor-123");
    const [payload] = state.split(".");
    const adulterado = `${payload}.assinatura-forjada-adulterada`;
    expect(validarEstado(adulterado).valido).toBe(false);
  });

  it("rejeita state com payload trocado (professorId de outra pessoa)", async () => {
    const { gerarEstado, validarEstado } = await import("../oauth-state");
    const stateA = gerarEstado("professor-A");
    const stateB = gerarEstado("professor-B");
    const [, assinaturaB] = stateB.split(".");
    const [payloadA] = stateA.split(".");
    expect(validarEstado(`${payloadA}.${assinaturaB}`).valido).toBe(false);
  });

  it("rejeita state expirado", async () => {
    const { validarEstado } = await import("../oauth-state");
    const { createHmac } = await import("crypto");
    const payload = JSON.stringify({ professorId: "x", nonce: "y", exp: Date.now() - 1000 });
    const payloadB64 = Buffer.from(payload).toString("base64url");
    const assinatura = createHmac("sha256", "segredo-de-teste").update(payloadB64).digest("base64url");
    expect(validarEstado(`${payloadB64}.${assinatura}`).valido).toBe(false);
  });

  it("rejeita state malformado", async () => {
    const { validarEstado } = await import("../oauth-state");
    expect(validarEstado("qualquer-coisa-sem-ponto").valido).toBe(false);
    expect(validarEstado("").valido).toBe(false);
  });
});

describe("gerarParPkce", () => {
  it("gera verifier e challenge diferentes e determinísticos a partir do verifier", async () => {
    const { gerarParPkce } = await import("../oauth-state");
    const { createHash } = await import("crypto");
    const { verifier, challenge } = gerarParPkce();
    const challengeEsperado = createHash("sha256").update(verifier).digest("base64url");
    expect(challenge).toBe(challengeEsperado);
    expect(verifier).not.toBe(challenge);
  });
});
