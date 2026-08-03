-- =========================================================
-- Migration: página pública do professor (ex.: personalenglishclass.com/p/joao-silva)
-- sem exigir login, com formulário "Quero uma aula" que gera uma
-- solicitação pendente pro professor — sem virar marketplace/busca
-- (isso fica pra uma fase futura). Rode isso no SQL editor do
-- Supabase depois do 0009.
-- =========================================================

alter table profiles
  add column slug text unique,
  add column bio text,
  add column preco_aula numeric,
  add column pagina_publica_ativa boolean not null default false;

-- Amplia a lista de colunas que o próprio usuário pode alterar via
-- update direto (mesmo padrão de concessão restrita da 0007).
revoke update on profiles from authenticated;
grant update (nome, telefone, data_nascimento, slug, bio, preco_aula, pagina_publica_ativa)
  on profiles to authenticated;

-- Marca se um agendamento avulso veio de um cadastro manual do
-- professor ou de uma solicitação pública, e seu status de triagem.
create type origem_agendamento_avulso as enum ('professor', 'publico');
create type status_agendamento_avulso as enum ('pendente', 'confirmado', 'recusado');

alter table agendamentos_avulsos
  add column origem origem_agendamento_avulso not null default 'professor',
  add column status status_agendamento_avulso not null default 'pendente',
  alter column data_hora drop not null;

-- Leitura pública (sem login) dos dados de vitrine de um professor
-- que ativou a própria página. Só expõe as colunas de vitrine —
-- nunca telefone, e-mail ou qualquer outro dado pessoal.
create or replace function perfil_publico_por_slug(p_slug text)
returns table (id uuid, nome text, bio text, preco_aula numeric)
language sql
security definer
set search_path = public
stable
as $$
  select id, nome, bio, preco_aula
  from profiles
  where slug = p_slug
    and role = 'professor'
    and pagina_publica_ativa = true;
$$;

grant execute on function perfil_publico_por_slug(text) to anon, authenticated;

-- Cria a solicitação de aula vinda da página pública. Roda como
-- security definer pois quem chama isso é um visitante anônimo, que
-- não tem (e não deve ter) permissão de insert direto na tabela.
create or replace function solicitar_aula_publica(
  p_slug text,
  p_nome text,
  p_email text,
  p_telefone text,
  p_mensagem text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professor_id uuid;
begin
  select id into v_professor_id
  from profiles
  where slug = p_slug
    and role = 'professor'
    and pagina_publica_ativa = true;

  if v_professor_id is null then
    raise exception 'Página não encontrada.';
  end if;

  if p_nome is null or trim(p_nome) = '' then
    raise exception 'Nome é obrigatório.';
  end if;

  insert into agendamentos_avulsos
    (professor_id, nome, email, telefone, tipo, origem, status, observacoes)
  values
    (v_professor_id, p_nome, nullif(p_email, ''), nullif(p_telefone, ''), 'outro', 'publico', 'pendente', nullif(p_mensagem, ''));
end;
$$;

grant execute on function solicitar_aula_publica(text, text, text, text, text) to anon, authenticated;
