import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";

const TTL_MS = 10 * 60 * 1000;

function segredo(): string {
  return process.env.GOOGLE_CLIENT_SECRET!;
}

/** `state` do OAuth: payload assinado com HMAC, sem precisar de tabela/sessão pra guardar. */
export function gerarEstado(professorId: string): string {
  const payload = JSON.stringify({ professorId, nonce: randomBytes(16).toString("hex"), exp: Date.now() + TTL_MS });
  const payloadB64 = Buffer.from(payload).toString("base64url");
  const assinatura = createHmac("sha256", segredo()).update(payloadB64).digest("base64url");
  return `${payloadB64}.${assinatura}`;
}

export function validarEstado(state: string): { valido: true; professorId: string } | { valido: false } {
  const [payloadB64, assinatura] = state.split(".");
  if (!payloadB64 || !assinatura) return { valido: false };

  const assinaturaEsperada = createHmac("sha256", segredo()).update(payloadB64).digest("base64url");
  const bufAssinatura = Buffer.from(assinatura);
  const bufEsperada = Buffer.from(assinaturaEsperada);
  if (bufAssinatura.length !== bufEsperada.length || !timingSafeEqual(bufAssinatura, bufEsperada)) {
    return { valido: false };
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString());
    if (typeof payload.exp !== "number" || Date.now() > payload.exp) return { valido: false };
    if (typeof payload.professorId !== "string") return { valido: false };
    return { valido: true, professorId: payload.professorId };
  } catch {
    return { valido: false };
  }
}

export function gerarParPkce(): { verifier: string; challenge: string } {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}
