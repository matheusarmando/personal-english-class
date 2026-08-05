/** Validação server-side — nunca confiar só no `type`/`required` do input no client. */
export function emailValido(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

/** Aceita DDD+número (10-11 dígitos) ou com código do país 55 (12-13 dígitos), com ou sem formatação. */
export function telefoneValido(telefone: string): boolean {
  const digitos = telefone.replace(/\D/g, "");
  return [10, 11, 12, 13].includes(digitos.length);
}

/** 8-60 caracteres, ao menos 1 maiúscula e 1 número. */
export function senhaValida(senha: string): boolean {
  return senha.length >= 8 && senha.length <= 60 && /[A-Z]/.test(senha) && /[0-9]/.test(senha);
}
