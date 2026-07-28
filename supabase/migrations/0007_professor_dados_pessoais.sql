-- =========================================================
-- Migration: professor (e qualquer papel) pode editar os
-- próprios dados pessoais (nome, telefone, data de nascimento).
-- Rode isso no SQL editor do Supabase depois do 0006.
--
-- Também fecha uma brecha de segurança pré-existente: a policy
-- "profiles_update_own" permitia (via USING sem WITH CHECK) que
-- qualquer usuário autenticado alterasse QUALQUER coluna da
-- própria linha em `profiles` por PATCH direto na API, incluindo
-- `role` — ou seja, um aluno podia se autopromover a gestor.
-- =========================================================

alter table profiles
  add column telefone text,
  add column data_nascimento date;

-- Restringe, por concessão de coluna, quais campos podem ser
-- alterados via update direto (mesmo por quem só tem a própria
-- linha liberada pela RLS). `role` fica de fora: só é alterável
-- manualmente via SQL editor, como já documentado no README.
revoke update on profiles from authenticated;
grant update (nome, telefone, data_nascimento) on profiles to authenticated;
