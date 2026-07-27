-- =========================================================
-- Migration: cadastro de alunos pelo professor
-- Rode isso no SQL editor do Supabase depois do schema.sql
-- =========================================================

-- Aluno cadastrado diretamente pelo professor (não exige login/auth.users)
create table alunos (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references profiles (id) on delete cascade,
  nome text not null,
  email text,
  telefone text,
  data_nascimento date,
  created_at timestamptz not null default now()
);

-- Datas/horários de aula agendados para um aluno
create table aluno_horarios (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  data_hora timestamptz not null,
  created_at timestamptz not null default now()
);

alter table alunos enable row level security;
alter table aluno_horarios enable row level security;

-- alunos: professor vê/gerencia os seus; gestor vê todos
create policy "alunos_select_prof_ou_gestor"
  on alunos for select
  using (professor_id = auth.uid() or auth_role() = 'gestor');

create policy "alunos_insert_professor"
  on alunos for insert
  with check (professor_id = auth.uid() and auth_role() = 'professor');

create policy "alunos_update_prof_ou_gestor"
  on alunos for update
  using (professor_id = auth.uid() or auth_role() = 'gestor');

create policy "alunos_delete_prof_ou_gestor"
  on alunos for delete
  using (professor_id = auth.uid() or auth_role() = 'gestor');

-- aluno_horarios: segue a mesma visibilidade do aluno relacionado
create policy "aluno_horarios_select"
  on aluno_horarios for select
  using (
    exists (
      select 1 from alunos a
      where a.id = aluno_horarios.aluno_id
        and (a.professor_id = auth.uid() or auth_role() = 'gestor')
    )
  );

create policy "aluno_horarios_insert"
  on aluno_horarios for insert
  with check (
    exists (
      select 1 from alunos a
      where a.id = aluno_horarios.aluno_id and a.professor_id = auth.uid()
    )
  );

create policy "aluno_horarios_delete"
  on aluno_horarios for delete
  using (
    exists (
      select 1 from alunos a
      where a.id = aluno_horarios.aluno_id
        and (a.professor_id = auth.uid() or auth_role() = 'gestor')
    )
  );
