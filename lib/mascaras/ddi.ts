/** Códigos de país mais comuns pra esta plataforma (professores/alunos de inglês no Brasil e arredores). */
export const DDIS: { codigo: string; pais: string }[] = [
  { codigo: "55", pais: "Brasil" },
  { codigo: "1", pais: "EUA/Canadá" },
  { codigo: "351", pais: "Portugal" },
  { codigo: "54", pais: "Argentina" },
  { codigo: "598", pais: "Uruguai" },
  { codigo: "595", pais: "Paraguai" },
  { codigo: "44", pais: "Reino Unido" },
  { codigo: "34", pais: "Espanha" },
  { codigo: "33", pais: "França" },
  { codigo: "49", pais: "Alemanha" },
  { codigo: "39", pais: "Itália" },
  { codigo: "81", pais: "Japão" },
  { codigo: "86", pais: "China" },
];

/**
 * Separa um telefone já salvo em DDI + resto. Dado legado (sem
 * prefixo "+CC ", já que o DDI é novo) cai sempre no default Brasil,
 * mantendo compatibilidade com tudo que já está no banco.
 */
export function extrairDdiENumero(valor?: string | null): { ddi: string; numero: string } {
  const bruto = (valor ?? "").trim();
  const match = bruto.match(/^\+?(\d{1,3})\s+(.+)$/);
  if (match && DDIS.some((d) => d.codigo === match[1])) {
    return { ddi: match[1], numero: match[2] };
  }
  return { ddi: "55", numero: bruto };
}
