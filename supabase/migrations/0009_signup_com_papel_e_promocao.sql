-- =========================================================
-- Migration: professor pode se cadastrar sozinho escolhendo o
-- próprio papel no signup (aluno ou professor — nunca gestor, por
-- segurança), e gestor ganha uma função pra promover/ajustar o
-- papel de qualquer usuário pela UI, sem precisar de SQL manual.
-- Rode isso no SQL editor do Supabase depois do 0008.
-- =========================================================

-- Substitui o trigger de signup pra ler `role_solicitado` do
-- metadata enviado pelo formulário de cadastro. Qualquer valor que
-- não seja exatamente 'professor' cai em 'aluno' (default seguro).
create or replace function handle_new_user() returns trigger as $$
declare
  v_role user_role;
begin
  v_role := case
    when new.raw_user_meta_data->>'role_solicitado' = 'professor' then 'professor'::user_role
    else 'aluno'::user_role
  end;

  insert into public.profiles (id, nome, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), v_role);

  update public.alunos
  set profile_id = new.id
  where email = new.email and profile_id is null;

  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Só um gestor pode alterar o papel de qualquer perfil (inclusive
-- promover a gestor, algo que o signup nunca permite sozinho).
create or replace function promover_usuario(p_profile_id uuid, p_novo_role user_role)
returns void as $$
begin
  if auth_role() != 'gestor' then
    raise exception 'Apenas gestores podem alterar papéis de usuário.';
  end if;

  update profiles set role = p_novo_role where id = p_profile_id;
end;
$$ language plpgsql security definer set search_path = public;
