-- =========================================================
-- Migration: vincula o cadastro de aluno (tabela alunos, criado
-- pelo professor) à conta de login do próprio aluno (profiles),
-- para que ele veja seu calendário de aulas.
-- Rode isso no SQL editor do Supabase depois do 0003.
-- =========================================================

alter table alunos
  add column profile_id uuid references profiles (id) on delete set null;

-- Liga automaticamente alunos.profile_id quando o e-mail bate com
-- uma conta já existente (seja o professor cadastrando um aluno que
-- já tem login, seja atualizando o e-mail de um aluno depois).
create or replace function link_aluno_por_email() returns trigger as $$
begin
  if new.profile_id is null and new.email is not null then
    select id into new.profile_id from auth.users where email = new.email limit 1;
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger before_alunos_link_profile
  before insert or update of email, profile_id on alunos
  for each row execute procedure link_aluno_por_email();

-- Cobre o caminho inverso: aluno se cadastra (signup) depois de já
-- existir um registro em `alunos` com o mesmo e-mail.
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, nome, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'aluno');

  update public.alunos
  set profile_id = new.id
  where email = new.email and profile_id is null;

  return new;
end;
$$ language plpgsql security definer;

-- aluno vê o próprio registro em `alunos` (além de professor/gestor)
create policy "alunos_select_proprio"
  on alunos for select
  using (profile_id = auth.uid());

-- aluno vê os próprios horários de aula
create policy "aluno_horarios_select_proprio"
  on aluno_horarios for select
  using (
    exists (
      select 1 from alunos a
      where a.id = aluno_horarios.aluno_id and a.profile_id = auth.uid()
    )
  );
