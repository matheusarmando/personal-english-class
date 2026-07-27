-- =========================================================
-- Schema inicial do MVP: personal-english-class
-- Rode isso no SQL editor do Supabase (ou via CLI/migration)
-- =========================================================

-- Papéis do sistema
create type user_role as enum ('aluno', 'professor', 'gestor');

-- Perfil de cada usuário autenticado (estende auth.users do Supabase)
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null,
  role user_role not null default 'aluno',
  created_at timestamptz not null default now()
);

-- Turmas
create table turmas (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  professor_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Matrícula do aluno em uma turma
create table matriculas (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references profiles (id) on delete cascade,
  turma_id uuid not null references turmas (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (aluno_id, turma_id)
);

-- Aulas de uma turma
create table aulas (
  id uuid primary key default gen_random_uuid(),
  turma_id uuid not null references turmas (id) on delete cascade,
  titulo text not null,
  data date not null,
  created_at timestamptz not null default now()
);

-- Presença de um aluno em uma aula
create table presencas (
  id uuid primary key default gen_random_uuid(),
  aula_id uuid not null references aulas (id) on delete cascade,
  aluno_id uuid not null references profiles (id) on delete cascade,
  presente boolean not null default false,
  created_at timestamptz not null default now(),
  unique (aula_id, aluno_id)
);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table profiles enable row level security;
alter table turmas enable row level security;
alter table matriculas enable row level security;
alter table aulas enable row level security;
alter table presencas enable row level security;

-- Helper: papel do usuário logado
create or replace function auth_role() returns user_role as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

-- profiles: usuário vê o próprio perfil; gestor vê todos
create policy "profiles_select_own_or_gestor"
  on profiles for select
  using (id = auth.uid() or auth_role() = 'gestor');

create policy "profiles_update_own"
  on profiles for update
  using (id = auth.uid());

-- turmas: professor vê/gerencia as suas; aluno vê as que está matriculado; gestor vê todas
create policy "turmas_select"
  on turmas for select
  using (
    auth_role() = 'gestor'
    or professor_id = auth.uid()
    or exists (
      select 1 from matriculas m
      where m.turma_id = turmas.id and m.aluno_id = auth.uid()
    )
  );

create policy "turmas_insert_professor_ou_gestor"
  on turmas for insert
  with check (auth_role() in ('professor', 'gestor'));

create policy "turmas_update_dono_ou_gestor"
  on turmas for update
  using (professor_id = auth.uid() or auth_role() = 'gestor');

-- matriculas: aluno vê as próprias; professor vê as das suas turmas; gestor vê todas
create policy "matriculas_select"
  on matriculas for select
  using (
    auth_role() = 'gestor'
    or aluno_id = auth.uid()
    or exists (
      select 1 from turmas t
      where t.id = matriculas.turma_id and t.professor_id = auth.uid()
    )
  );

-- aulas: mesma regra de visibilidade da turma
create policy "aulas_select"
  on aulas for select
  using (
    auth_role() = 'gestor'
    or exists (
      select 1 from turmas t
      where t.id = aulas.turma_id and t.professor_id = auth.uid()
    )
    or exists (
      select 1 from matriculas m
      where m.turma_id = aulas.turma_id and m.aluno_id = auth.uid()
    )
  );

create policy "aulas_insert_professor_dono_ou_gestor"
  on aulas for insert
  with check (
    auth_role() = 'gestor'
    or exists (
      select 1 from turmas t
      where t.id = aulas.turma_id and t.professor_id = auth.uid()
    )
  );

-- presencas: aluno vê a própria; professor gerencia as das suas aulas; gestor vê todas
create policy "presencas_select"
  on presencas for select
  using (
    auth_role() = 'gestor'
    or aluno_id = auth.uid()
    or exists (
      select 1 from aulas a
      join turmas t on t.id = a.turma_id
      where a.id = presencas.aula_id and t.professor_id = auth.uid()
    )
  );

create policy "presencas_upsert_professor_dono_ou_gestor"
  on presencas for insert
  with check (
    auth_role() = 'gestor'
    or exists (
      select 1 from aulas a
      join turmas t on t.id = a.turma_id
      where a.id = presencas.aula_id and t.professor_id = auth.uid()
    )
  );

create policy "presencas_update_professor_dono_ou_gestor"
  on presencas for update
  using (
    auth_role() = 'gestor'
    or exists (
      select 1 from aulas a
      join turmas t on t.id = a.turma_id
      where a.id = presencas.aula_id and t.professor_id = auth.uid()
    )
  );

-- =========================================================
-- Trigger: cria o profile automaticamente ao registrar usuário
-- (role default 'aluno'; ajuste manual necessário para professor/gestor)
-- =========================================================
create or replace function handle_new_user() returns trigger as $$
begin
  insert into public.profiles (id, nome, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome', new.email), 'aluno');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();
