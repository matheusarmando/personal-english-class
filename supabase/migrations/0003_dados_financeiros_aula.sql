-- =========================================================
-- Migration: link da aula, dados financeiros e status do aluno
-- Rode isso no SQL editor do Supabase depois do 0002_cadastro_alunos.sql
-- =========================================================

create type status_pagamento_aluno as enum ('pendente', 'pago', 'atrasado');

alter table alunos
  add column link_aula text,
  add column valor numeric(10, 2),
  add column status_pagamento status_pagamento_aluno not null default 'pendente',
  add column ativo boolean not null default true,
  add column pix_copia_cola text;
