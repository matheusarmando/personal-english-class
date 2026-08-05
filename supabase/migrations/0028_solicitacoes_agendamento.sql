-- =========================================================
-- Migration: aluno solicita remarcação/cancelamento de uma aula (ou,
-- a partir do v2, aula extra sem vínculo com um horário existente).
-- A aprovação em si (atualizar aluno_horarios) é feita pelo código da
-- aplicação com a sessão do professor — já existe policy de update em
-- aluno_horarios pro professor (migration 0008), então não precisa de
-- nenhuma policy nova ali. Rode depois do 0027.
-- =========================================================

create type tipo_solicitacao_agendamento as enum ('remarcacao', 'cancelamento', 'aula_extra');
create type status_solicitacao_agendamento as enum ('pendente', 'aprovada', 'recusada');

create table solicitacoes_agendamento (
  id uuid primary key default gen_random_uuid(),
  aluno_id uuid not null references alunos (id) on delete cascade,
  professor_id uuid not null references profiles (id) on delete cascade,
  tipo tipo_solicitacao_agendamento not null,
  aula_horario_id uuid references aluno_horarios (id) on delete set null,
  data_hora_sugerida timestamptz,
  motivo text,
  status status_solicitacao_agendamento not null default 'pendente',
  resposta_professor text,
  created_at timestamptz not null default now(),
  respondida_em timestamptz
);

create index solicitacoes_agendamento_professor_id_idx on solicitacoes_agendamento (professor_id, status);
create index solicitacoes_agendamento_aluno_id_idx on solicitacoes_agendamento (aluno_id);

alter table solicitacoes_agendamento enable row level security;

-- aluno vê e cria só as próprias
create policy "solicitacoes_select_aluno"
  on solicitacoes_agendamento for select
  using (
    exists (
      select 1 from alunos a
      where a.id = solicitacoes_agendamento.aluno_id and a.profile_id = auth.uid()
    )
  );

create policy "solicitacoes_insert_aluno"
  on solicitacoes_agendamento for insert
  with check (
    auth_role() = 'aluno'
    and exists (
      select 1 from alunos a
      where a.id = solicitacoes_agendamento.aluno_id
        and a.profile_id = auth.uid()
        and a.professor_id = solicitacoes_agendamento.professor_id
    )
    -- se referenciar um horário, ele precisa ser do próprio aluno
    and (
      aula_horario_id is null
      or exists (
        select 1 from aluno_horarios h
        where h.id = solicitacoes_agendamento.aula_horario_id
          and h.aluno_id = solicitacoes_agendamento.aluno_id
      )
    )
  );

-- professor vê e responde só as que são endereçadas a ele
create policy "solicitacoes_select_professor"
  on solicitacoes_agendamento for select
  using (professor_id = auth.uid());

create policy "solicitacoes_update_professor"
  on solicitacoes_agendamento for update
  using (professor_id = auth.uid());

-- só status/resposta/respondida_em são alteráveis via update direto —
-- e só por quem bate com a policy acima (o professor dono). Mesmo
-- padrão de grant restrito por coluna das migrations 0007/0014/0027.
revoke update on solicitacoes_agendamento from authenticated;
grant update (status, resposta_professor, respondida_em) on solicitacoes_agendamento to authenticated;
