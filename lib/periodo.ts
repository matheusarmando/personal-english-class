function formatarISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Primeiro e último dia do mês corrente, no formato YYYY-MM-DD — período padrão dos relatórios. */
export function periodoMesAtual(hoje: Date = new Date()): { de: string; ate: string } {
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();
  return {
    de: formatarISO(new Date(ano, mes, 1)),
    ate: formatarISO(new Date(ano, mes + 1, 0)),
  };
}
