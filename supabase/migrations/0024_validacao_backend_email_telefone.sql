-- =========================================================
-- Migration: validação server-side de e-mail/telefone também na
-- rota pública (solicitar_aula_publica), que é a mais exposta —
-- 100% anônima, sem passar por nenhuma tela do app. O front já
-- valida, mas nada impede um POST direto no RPC com valor qualquer.
-- =========================================================

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

  if p_email is not null and trim(p_email) <> '' and p_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'E-mail em formato inválido.';
  end if;

  if p_telefone is not null and trim(p_telefone) <> ''
     and length(regexp_replace(p_telefone, '\D', '', 'g')) not in (10, 11, 12, 13) then
    raise exception 'Telefone em formato inválido.';
  end if;

  insert into agendamentos_avulsos
    (professor_id, nome, email, telefone, tipo, origem, status, observacoes)
  values
    (v_professor_id, p_nome, nullif(p_email, ''), nullif(p_telefone, ''), 'outro', 'publico', 'pendente', nullif(p_mensagem, ''));
end;
$$;
