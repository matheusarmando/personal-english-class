-- =========================================================
-- Migration: tarefas atribuídas pelo professor a um aluno (ou a
-- todos os alunos ativos, quando aluno_id é nulo — "tarefa geral").
--
-- O status (pendente/entregue/avaliada) NÃO é uma coluna em `tarefas`:
-- numa tarefa geral, cada aluno progride de forma independente, então
-- o status é sempre derivado por aluno a partir da existência (e nota)
-- da linha em `tarefa_entregas`. Guardar um único status por tarefa
-- quebraria exatamente esse caso. Rode depois do 0026.
-- =========================================================

create table tarefas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references profiles (id) on delete cascade,
  aluno_id uuid references alunos (id) on delete cascade,
  titulo text not null,
  descricao text,
  prazo date not null,
  pontos int not null default 0,
  permite_reenvio boolean not null default false,
  created_at timestamptz not null default now()
);

create index tarefas_professor_id_idx on tarefas (professor_id);
create index tarefas_aluno_id_idx on tarefas (aluno_id);

-- Uma entrega por (tarefa, aluno). Reenvio (permite_reenvio) fica pro
-- v2 — em v1 o aluno só envia uma vez.
create table tarefa_entregas (
  id uuid primary key default gen_random_uuid(),
  tarefa_id uuid not null references tarefas (id) on delete cascade,
  aluno_id uuid not null references alunos (id) on delete cascade,
  texto_resposta text,
  arquivo_url text,
  nota int,
  feedback_professor text,
  enviado_em timestamptz not null default now(),
  avaliado_em timestamptz,
  unique (tarefa_id, aluno_id)
);

create index tarefa_entregas_tarefa_id_idx on tarefa_entregas (tarefa_id);
create index tarefa_entregas_aluno_id_idx on tarefa_entregas (aluno_id);

alter table tarefas enable row level security;
alter table tarefa_entregas enable row level security;

-- tarefas: professor gerencia só as próprias
create policy "tarefas_select_professor"
  on tarefas for select
  using (professor_id = auth.uid());

create policy "tarefas_insert_professor"
  on tarefas for insert
  with check (professor_id = auth.uid() and auth_role() = 'professor');

create policy "tarefas_update_professor"
  on tarefas for update
  using (professor_id = auth.uid());

create policy "tarefas_delete_professor"
  on tarefas for delete
  using (professor_id = auth.uid());

-- tarefas: aluno vê as próprias (individuais) e as gerais do seu professor
create policy "tarefas_select_aluno"
  on tarefas for select
  using (
    exists (
      select 1 from alunos a
      where a.profile_id = auth.uid()
        and a.professor_id = tarefas.professor_id
        and (tarefas.aluno_id is null or tarefas.aluno_id = a.id)
    )
  );

-- tarefa_entregas: professor vê e avalia entregas das próprias tarefas
create policy "tarefa_entregas_select_professor"
  on tarefa_entregas for select
  using (
    exists (
      select 1 from tarefas t
      where t.id = tarefa_entregas.tarefa_id and t.professor_id = auth.uid()
    )
  );

create policy "tarefa_entregas_update_professor"
  on tarefa_entregas for update
  using (
    exists (
      select 1 from tarefas t
      where t.id = tarefa_entregas.tarefa_id and t.professor_id = auth.uid()
    )
  );

-- Só nota/feedback/avaliado_em são alteráveis via update direto — e só
-- por quem bate com a policy de update acima (dono da tarefa). Mesmo
-- padrão de grant restrito por coluna das migrations 0007/0014.
revoke update on tarefa_entregas from authenticated;
grant update (nota, feedback_professor, avaliado_em) on tarefa_entregas to authenticated;

-- tarefa_entregas: aluno vê e envia a própria entrega
create policy "tarefa_entregas_select_aluno"
  on tarefa_entregas for select
  using (
    exists (
      select 1 from alunos a
      where a.id = tarefa_entregas.aluno_id and a.profile_id = auth.uid()
    )
  );

create policy "tarefa_entregas_insert_aluno"
  on tarefa_entregas for insert
  with check (
    exists (
      select 1 from alunos a
      join tarefas t on t.id = tarefa_entregas.tarefa_id
      where a.id = tarefa_entregas.aluno_id
        and a.profile_id = auth.uid()
        and a.professor_id = t.professor_id
        and (t.aluno_id is null or t.aluno_id = a.id)
    )
  );
