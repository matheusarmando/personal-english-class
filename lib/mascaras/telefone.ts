/**
 * Formata progressivamente enquanto o usuário digita — sempre a partir
 * dos dígitos brutos (nunca do texto já mascarado), então colar um
 * número já formatado não duplica caracteres nem quebra o resultado.
 * Celular (11 dígitos): (XX) XXXXX-XXXX. Fixo (até 10): (XX) XXXX-XXXX.
 */
export function aplicarMascaraTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);

  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  }
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}
