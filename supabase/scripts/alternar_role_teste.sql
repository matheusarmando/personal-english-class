-- =========================================================
-- Script de dev: alterna o role de um usuário de teste entre
-- aluno -> professor -> gestor -> aluno a cada execução.
-- Rode no SQL editor do Supabase sempre que quiser testar
-- outra área com o mesmo usuário.
-- =========================================================

do $$
declare
  v_email text := 'matheusarmando90@gmail.com';
  v_current user_role;
  v_next user_role;
begin
  select p.role into v_current
  from profiles p
  join auth.users u on u.id = p.id
  where u.email = v_email;

  if v_current is null then
    raise exception 'Nenhum profile encontrado para o e-mail %', v_email;
  end if;

  v_next := case v_current
    when 'aluno' then 'professor'
    when 'professor' then 'gestor'
    when 'gestor' then 'aluno'
  end;

  update profiles
  set role = v_next
  where id = (select id from auth.users where email = v_email);

  raise notice 'role de % alterado de % para %', v_email, v_current, v_next;
end $$;

-- Conferir o resultado:
select u.email, p.nome, p.role
from profiles p
join auth.users u on u.id = p.id
where u.email = 'matheusarmando90@gmail.com';
