-- =========================================================
-- Migration: permite que o aluno edite apenas nome, telefone e
-- data de nascimento do próprio cadastro (demais campos ficam
-- somente leitura para ele). Não há policy de UPDATE genérica
-- para o aluno em `alunos` — a única forma de alterar é por esta
-- função, que restringe explicitamente as colunas e a própria linha.
-- Rode isso no SQL editor do Supabase depois do 0004.
-- =========================================================

create or replace function atualizar_dados_pessoais_aluno(
  p_nome text,
  p_telefone text,
  p_data_nascimento date
) returns void as $$
begin
  update alunos
  set nome = p_nome,
      telefone = p_telefone,
      data_nascimento = p_data_nascimento
  where profile_id = auth.uid();
end;
$$ language plpgsql security definer set search_path = public;
