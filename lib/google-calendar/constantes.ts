/**
 * Chave de `extendedProperties.private` usada pra marcar um evento do
 * Google Calendar como criado pela própria plataforma (guarda o id da
 * aula em `aluno_horarios`). Usada tanto na escrita (marcar o evento
 * ao criar) quanto na leitura (excluir da checagem de ocupação —
 * senão a própria aula do professor conta como conflito contra ela
 * mesma assim que passa a ser espelhada de volta pelo sync).
 */
export const CHAVE_MARCADOR_AULA = "appAulaId";
