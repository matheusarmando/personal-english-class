/**
 * Definições dos templates que precisam ser criados e aprovados no
 * Meta Business Manager (WhatsApp Manager → Templates de mensagem)
 * antes de qualquer envio funcionar. Os nomes e a quantidade de
 * variáveis aqui têm que bater exatamente com o que foi aprovado lá.
 */

export const TEMPLATE_LEMBRETE_AULA = {
  nome: "lembrete_aula",
  corpoParaAprovacao:
    "Olá {{1}}! 👋\nSua aula com o professor {{2}} começa hoje às {{3}}.\n\n🎥 Link da aula: {{4}}",
};

export const TEMPLATE_RESUMO_AULA = {
  nome: "resumo_aula",
  corpoParaAprovacao:
    "Aula concluída ✅\n\nConteúdo: {{1}}\nExercício: {{2}}",
};

export const TEMPLATE_COBRANCA = {
  nome: "cobranca_vencimento",
  corpoParaAprovacao:
    "Olá {{1}}! Sua mensalidade vence amanhã.\n\nValor: {{2}}\n\nPix copia e cola:\n{{3}}",
};

export const TEMPLATE_PARCELA_LEMBRETE = {
  nome: "parcela_lembrete",
  corpoParaAprovacao:
    "Olá {{1}}! 👋\nSua parcela de {{2}} vence em {{3}}.\n\nPix copia e cola:\n{{4}}",
};

export const TEMPLATE_PARCELA_ATRASO = {
  nome: "parcela_atraso",
  corpoParaAprovacao:
    "Olá {{1}}! Sua parcela de {{2}} está atrasada desde {{3}}.\n\nPix copia e cola:\n{{4}}",
};

export function renderizarLembreteAula(params: {
  aluno: string;
  professor: string;
  hora: string;
  linkAula: string;
}) {
  return `Olá ${params.aluno}! 👋\nSua aula com o professor ${params.professor} começa hoje às ${params.hora}.\n\n🎥 Link da aula: ${params.linkAula}`;
}

export function renderizarResumoAula(params: {
  conteudo: string;
  exercicio: string;
}) {
  return `Aula concluída ✅\n\nConteúdo: ${params.conteudo}\nExercício: ${params.exercicio}`;
}

export function renderizarCobranca(params: {
  aluno: string;
  valor: string;
  pix: string;
}) {
  return `Olá ${params.aluno}! Sua mensalidade vence amanhã.\n\nValor: ${params.valor}\n\nPix copia e cola:\n${params.pix}`;
}

export function renderizarParcelaLembrete(params: {
  aluno: string;
  valor: string;
  vencimento: string;
  pix: string;
}) {
  return `Olá ${params.aluno}! 👋\nSua parcela de ${params.valor} vence em ${params.vencimento}.\n\nPix copia e cola:\n${params.pix}`;
}

export function renderizarParcelaAtraso(params: {
  aluno: string;
  valor: string;
  vencimento: string;
  pix: string;
}) {
  return `Olá ${params.aluno}! Sua parcela de ${params.valor} está atrasada desde ${params.vencimento}.\n\nPix copia e cola:\n${params.pix}`;
}
