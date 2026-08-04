export type AulaDoDia = {
  id: string;
  hora: string;
  titulo: string;
  linkAula?: string | null;
  observacoes?: string | null;
  contato?: string | null;
};

export const LABEL_TIPO_AGENDAMENTO: Record<string, string> = {
  teste_proficiencia: "Teste de proficiência",
  aula_experimental: "Aula experimental",
  outro: "Outro",
};

export function chaveDia(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function resolverMesReferencia(mes?: string) {
  const hoje = new Date();
  const [ano, mesNum] = (mes ?? "").split("-").map(Number);
  return ano && mesNum
    ? new Date(ano, mesNum - 1, 1)
    : new Date(hoje.getFullYear(), hoje.getMonth(), 1);
}
