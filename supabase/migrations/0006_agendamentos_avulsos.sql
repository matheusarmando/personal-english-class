-- =========================================================
-- Migration: agendamentos avulsos do professor (ex.: aula de
-- teste de proficiência, aula experimental) — não exigem um
-- cadastro prévio em `alunos`.
-- Rode isso no SQL editor do Supabase depois do 0005.
-- =========================================================

create type tipo_agendamento_avulso as enum (
  'teste_proficiencia',
  'aula_experimental',
  'outro'
);

create table agendamentos_avulsos (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references profiles (id) on delete cascade,
  nome text not null,
  email text,
  telefone text,
  tipo tipo_agendamento_avulso not null default 'outro',
  data_hora timestamptz not null,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table agendamentos_avulsos enable row level security;

create policy "agendamentos_avulsos_select_prof_ou_gestor"
  on agendamentos_avulsos for select
  using (professor_id = auth.uid() or auth_role() = 'gestor');

create policy "agendamentos_avulsos_insert_professor"
  on agendamentos_avulsos for insert
  with check (professor_id = auth.uid() and auth_role() = 'professor');

create policy "agendamentos_avulsos_update_prof_ou_gestor"
  on agendamentos_avulsos for update
  using (professor_id = auth.uid() or auth_role() = 'gestor');

create policy "agendamentos_avulsos_delete_prof_ou_gestor"
  on agendamentos_avulsos for delete
  using (professor_id = auth.uid() or auth_role() = 'gestor');
