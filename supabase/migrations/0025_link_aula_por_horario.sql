-- =========================================================
-- Migration: link da aula pode ser fixo por aluno (aluno_horarios
-- ainda usa o padrão de alunos.link_aula quando essa coluna é nula)
-- ou sobrescrito pontualmente por aula/sessão específica.
-- =========================================================

alter table aluno_horarios
  add column link_aula text;
