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

/**
 * Sempre em UTC — nunca hora local. `mesRef` e as chaves de
 * aulasPorDia/eventosGooglePorDia são construídos no servidor (que
 * roda em UTC); se isso usasse getFullYear/getMonth/getDate (hora
 * local), o mesmo Date vira um dia diferente quando o componente
 * cliente reidrata no navegador do usuário (ex.: em horário de
 * Brasília, UTC-3), deslocando o calendário inteiro num fuso mais
 * atrasado — foi exatamente esse o bug que fez o mês e os eventos do
 * Google sumirem/aparecerem errados.
 */
export function chaveDia(d: Date) {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(
    d.getUTCDate()
  ).padStart(2, "0")}`;
}

/** Sempre devolve meia-noite UTC do dia 1 — mesmo motivo do chaveDia acima. */
export function resolverMesReferencia(mes?: string) {
  const hoje = new Date();
  const [ano, mesNum] = (mes ?? "").split("-").map(Number);
  return ano && mesNum
    ? new Date(Date.UTC(ano, mesNum - 1, 1))
    : new Date(Date.UTC(hoje.getUTCFullYear(), hoje.getUTCMonth(), 1));
}
