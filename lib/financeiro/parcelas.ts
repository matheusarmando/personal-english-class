import type { ParcelaGerada } from "./tipos";

/**
 * Gera as parcelas de um contrato. Função pura — sem I/O, sem banco.
 *
 * Vencimento: parcela N cai `N-1` meses depois do mês de
 * `dataInicio`, no dia `diaVencimento` — ou no último dia do mês
 * quando esse dia não existe nele (ex.: dia 31 em fevereiro). A
 * virada de ano é só uma consequência de somar meses e normalizar
 * (mês 13 vira janeiro do ano seguinte), sem caso especial.
 *
 * Valor: `valorTotalCentavos` é dividido em partes iguais
 * (arredondadas pra baixo); o resto do arredondamento vai inteiro pra
 * última parcela, garantindo que a soma bata exatamente com o valor
 * total — nunca soma um centavo a mais ou a menos por erro de ponto
 * flutuante (por isso tudo aqui é `number` inteiro, nunca float).
 */
export function gerarParcelas(params: {
  /** Data pura YYYY-MM-DD. */
  dataInicio: string;
  diaVencimento: number;
  numeroParcelas: number;
  valorTotalCentavos: number;
  /** Número da primeira parcela gerada (usado ao editar um contrato
   * pra continuar a numeração depois das parcelas já pagas). */
  numeroInicial?: number;
}): ParcelaGerada[] {
  const { dataInicio, diaVencimento, numeroParcelas, valorTotalCentavos, numeroInicial = 1 } = params;

  if (numeroParcelas < 1) {
    throw new Error("numeroParcelas deve ser maior ou igual a 1.");
  }
  if (diaVencimento < 1 || diaVencimento > 31) {
    throw new Error("diaVencimento deve estar entre 1 e 31.");
  }

  const [anoInicioStr, mesInicioStr] = dataInicio.split("-");
  const anoInicio = Number(anoInicioStr);
  const mesInicio = Number(mesInicioStr);

  const valorBase = Math.floor(valorTotalCentavos / numeroParcelas);
  const resto = valorTotalCentavos - valorBase * numeroParcelas;

  const parcelas: ParcelaGerada[] = [];

  for (let i = 0; i < numeroParcelas; i++) {
    const mesIndex = mesInicio - 1 + i;
    const ano = anoInicio + Math.floor(mesIndex / 12);
    const mes = (mesIndex % 12) + 1;
    const ultimoDiaDoMes = new Date(ano, mes, 0).getDate();
    const dia = Math.min(diaVencimento, ultimoDiaDoMes);
    const vencimento = `${ano}-${String(mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;

    const valorCentavos = valorBase + (i === numeroParcelas - 1 ? resto : 0);

    parcelas.push({ numero: numeroInicial + i, valorCentavos, vencimento });
  }

  return parcelas;
}
