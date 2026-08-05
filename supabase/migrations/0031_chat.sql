-- =========================================================
-- Migration: chat 1:1 entre professor e aluno. Uma conversa por par
-- (professor, aluno) — criada sob demanda pela aplicação (get-or-
-- -create) na primeira vez que qualquer um dos dois abre o chat.
-- Sem realtime nesta fase (v1); a leitura é sempre um novo request.
-- Rode depois do 0030.
-- =========================================================

create table conversas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references profiles (id) on delete cascade,
  aluno_id uuid not null references alunos (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (professor_id, aluno_id)
);

create table mensagens (
  id uuid primary key default gen_random_uuid(),
  conversa_id uuid not null references conversas (id) on delete cascade,
  remetente_id uuid not null references profiles (id) on delete cascade,
  texto text not null,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);

create index mensagens_conversa_id_idx on mensagens (conversa_id, created_at);

alter table conversas enable row level security;
alter table mensagens enable row level security;

-- conversas: professor vê e cria as próprias (só com aluno que é dele)
create policy "conversas_select_professor"
  on conversas for select
  using (professor_id = auth.uid());

create policy "conversas_insert_professor"
  on conversas for insert
  with check (
    professor_id = auth.uid()
    and auth_role() = 'professor'
    and exists (select 1 from alunos a where a.id = conversas.aluno_id and a.professor_id = auth.uid())
  );

-- conversas: aluno vê e cria a própria (só com o professor que é o dele)
create policy "conversas_select_aluno"
  on conversas for select
  using (
    exists (select 1 from alunos a where a.id = conversas.aluno_id and a.profile_id = auth.uid())
  );

create policy "conversas_insert_aluno"
  on conversas for insert
  with check (
    auth_role() = 'aluno'
    and exists (
      select 1 from alunos a
      where a.id = conversas.aluno_id
        and a.profile_id = auth.uid()
        and a.professor_id = conversas.professor_id
    )
  );

-- mensagens: só quem participa da conversa (professor dono ou aluno
-- dono) pode ler ou escrever nela.
create policy "mensagens_select_participantes"
  on mensagens for select
  using (
    exists (
      select 1 from conversas c
      where c.id = mensagens.conversa_id
        and (
          c.professor_id = auth.uid()
          or exists (select 1 from alunos a where a.id = c.aluno_id and a.profile_id = auth.uid())
        )
    )
  );

create policy "mensagens_insert_participantes"
  on mensagens for insert
  with check (
    remetente_id = auth.uid()
    and exists (
      select 1 from conversas c
      where c.id = mensagens.conversa_id
        and (
          c.professor_id = auth.uid()
          or exists (select 1 from alunos a where a.id = c.aluno_id and a.profile_id = auth.uid())
        )
    )
  );
