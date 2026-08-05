-- =========================================================
-- Migration: provas de múltipla escolha com correção automática.
-- Feature nova dos dois lados (não existia nem mock no professor —
-- app/professor/provas era só uma tela "Em breve").
--
-- `prova_alternativas` NÃO tem policy de select pro aluno — só o
-- professor (dono da prova) enxerga a linha inteira, incluindo
-- `correta`. O aluno só acessa o conteúdo da prova (sem a resposta
-- certa) e só envia respostas através das funções security definer
-- abaixo, mesmo padrão já usado no financeiro (0013): nenhuma escrita
-- sensível por policy de insert direta, sempre com checagem de dono/
-- atribuição dentro da função. Rode depois do 0031.
-- =========================================================

create type status_prova as enum ('rascunho', 'publicada', 'encerrada');

create table provas (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references profiles (id) on delete cascade,
  titulo text not null,
  descricao text,
  data_aplicacao date,
  status status_prova not null default 'rascunho',
  created_at timestamptz not null default now()
);

create table prova_questoes (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references provas (id) on delete cascade,
  enunciado text not null,
  ordem int not null default 0,
  pontos int not null default 1
);

create table prova_alternativas (
  id uuid primary key default gen_random_uuid(),
  questao_id uuid not null references prova_questoes (id) on delete cascade,
  texto text not null,
  correta boolean not null default false,
  ordem int not null default 0
);

create table prova_atribuicoes (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references provas (id) on delete cascade,
  aluno_id uuid not null references alunos (id) on delete cascade,
  -- preenchidos por submeter_prova() ao corrigir — evita o aluno
  -- precisar de acesso a prova_alternativas.correta só pra reexibir a
  -- própria nota numa visita posterior.
  respondido_em timestamptz,
  nota int,
  unique (prova_id, aluno_id)
);

create table prova_respostas (
  id uuid primary key default gen_random_uuid(),
  prova_id uuid not null references provas (id) on delete cascade,
  aluno_id uuid not null references alunos (id) on delete cascade,
  questao_id uuid not null references prova_questoes (id) on delete cascade,
  alternativa_escolhida_id uuid not null references prova_alternativas (id) on delete cascade,
  enviado_em timestamptz not null default now(),
  unique (prova_id, aluno_id, questao_id)
);

create index prova_questoes_prova_id_idx on prova_questoes (prova_id);
create index prova_alternativas_questao_id_idx on prova_alternativas (questao_id);
create index prova_atribuicoes_prova_id_idx on prova_atribuicoes (prova_id);
create index prova_atribuicoes_aluno_id_idx on prova_atribuicoes (aluno_id);
create index prova_respostas_prova_aluno_idx on prova_respostas (prova_id, aluno_id);

alter table provas enable row level security;
alter table prova_questoes enable row level security;
alter table prova_alternativas enable row level security;
alter table prova_atribuicoes enable row level security;
alter table prova_respostas enable row level security;

-- provas: professor gerencia só as próprias
create policy "provas_select_professor" on provas for select using (professor_id = auth.uid());
create policy "provas_insert_professor" on provas for insert
  with check (professor_id = auth.uid() and auth_role() = 'professor');
create policy "provas_update_professor" on provas for update using (professor_id = auth.uid());
create policy "provas_delete_professor" on provas for delete using (professor_id = auth.uid());

-- provas: aluno vê só as publicadas e atribuídas a ele
create policy "provas_select_aluno" on provas for select
  using (
    status = 'publicada'
    and exists (
      select 1 from prova_atribuicoes at
      join alunos a on a.id = at.aluno_id
      where at.prova_id = provas.id and a.profile_id = auth.uid()
    )
  );

-- prova_questoes: professor gerencia via dono da prova
create policy "prova_questoes_select_professor" on prova_questoes for select
  using (exists (select 1 from provas p where p.id = prova_questoes.prova_id and p.professor_id = auth.uid()));
create policy "prova_questoes_insert_professor" on prova_questoes for insert
  with check (exists (select 1 from provas p where p.id = prova_questoes.prova_id and p.professor_id = auth.uid()));
create policy "prova_questoes_update_professor" on prova_questoes for update
  using (exists (select 1 from provas p where p.id = prova_questoes.prova_id and p.professor_id = auth.uid()));
create policy "prova_questoes_delete_professor" on prova_questoes for delete
  using (exists (select 1 from provas p where p.id = prova_questoes.prova_id and p.professor_id = auth.uid()));

-- prova_questoes: aluno vê o enunciado (sem alternativas) das provas publicadas e atribuídas
create policy "prova_questoes_select_aluno" on prova_questoes for select
  using (
    exists (
      select 1 from provas p
      join prova_atribuicoes at on at.prova_id = p.id
      join alunos a on a.id = at.aluno_id
      where p.id = prova_questoes.prova_id and p.status = 'publicada' and a.profile_id = auth.uid()
    )
  );

-- prova_alternativas: só o professor (dono) tem select/insert/update/delete —
-- de propósito, sem nenhuma policy pro aluno (ver comentário no topo do arquivo).
create policy "prova_alternativas_select_professor" on prova_alternativas for select
  using (
    exists (
      select 1 from prova_questoes pq
      join provas p on p.id = pq.prova_id
      where pq.id = prova_alternativas.questao_id and p.professor_id = auth.uid()
    )
  );
create policy "prova_alternativas_insert_professor" on prova_alternativas for insert
  with check (
    exists (
      select 1 from prova_questoes pq
      join provas p on p.id = pq.prova_id
      where pq.id = prova_alternativas.questao_id and p.professor_id = auth.uid()
    )
  );
create policy "prova_alternativas_update_professor" on prova_alternativas for update
  using (
    exists (
      select 1 from prova_questoes pq
      join provas p on p.id = pq.prova_id
      where pq.id = prova_alternativas.questao_id and p.professor_id = auth.uid()
    )
  );
create policy "prova_alternativas_delete_professor" on prova_alternativas for delete
  using (
    exists (
      select 1 from prova_questoes pq
      join provas p on p.id = pq.prova_id
      where pq.id = prova_alternativas.questao_id and p.professor_id = auth.uid()
    )
  );

-- prova_atribuicoes: professor atribui só alunos que são dele, em provas que são dele
create policy "prova_atribuicoes_select_professor" on prova_atribuicoes for select
  using (exists (select 1 from provas p where p.id = prova_atribuicoes.prova_id and p.professor_id = auth.uid()));
create policy "prova_atribuicoes_insert_professor" on prova_atribuicoes for insert
  with check (
    exists (select 1 from provas p where p.id = prova_atribuicoes.prova_id and p.professor_id = auth.uid())
    and exists (select 1 from alunos a where a.id = prova_atribuicoes.aluno_id and a.professor_id = auth.uid())
  );
create policy "prova_atribuicoes_delete_professor" on prova_atribuicoes for delete
  using (exists (select 1 from provas p where p.id = prova_atribuicoes.prova_id and p.professor_id = auth.uid()));

-- prova_atribuicoes: aluno vê as próprias atribuições
create policy "prova_atribuicoes_select_aluno" on prova_atribuicoes for select
  using (exists (select 1 from alunos a where a.id = prova_atribuicoes.aluno_id and a.profile_id = auth.uid()));

-- prova_respostas: só select direto (professor dono ou aluno dono) —
-- toda escrita passa por submeter_prova(), abaixo.
create policy "prova_respostas_select_professor" on prova_respostas for select
  using (exists (select 1 from provas p where p.id = prova_respostas.prova_id and p.professor_id = auth.uid()));
create policy "prova_respostas_select_aluno" on prova_respostas for select
  using (exists (select 1 from alunos a where a.id = prova_respostas.aluno_id and a.profile_id = auth.uid()));

-- =========================================================
-- Funções de negócio (security definer, mesmo padrão do 0013)
-- =========================================================

-- Cria uma questão com suas alternativas numa única transação — uma
-- questão sem alternativa (ou sem exatamente uma correta) quebra a
-- prova pro aluno, então isso não pode ficar por conta de dois inserts
-- separados na aplicação.
create or replace function adicionar_questao_prova(
  p_prova_id uuid,
  p_enunciado text,
  p_pontos int,
  p_ordem int,
  p_alternativas jsonb -- [{ texto, correta, ordem }]
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_questao_id uuid;
  v_item jsonb;
  v_total_corretas int;
begin
  if not exists (select 1 from provas where id = p_prova_id and professor_id = auth.uid()) then
    raise exception 'Prova não encontrada ou sem permissão.';
  end if;

  select count(*) into v_total_corretas
  from jsonb_array_elements(p_alternativas) alt
  where (alt->>'correta')::boolean;

  if v_total_corretas != 1 then
    raise exception 'Marque exatamente uma alternativa como correta.';
  end if;

  insert into prova_questoes (prova_id, enunciado, pontos, ordem)
  values (p_prova_id, p_enunciado, p_pontos, p_ordem)
  returning id into v_questao_id;

  for v_item in select * from jsonb_array_elements(p_alternativas) loop
    insert into prova_alternativas (questao_id, texto, correta, ordem)
    values (
      v_questao_id,
      v_item->>'texto',
      (v_item->>'correta')::boolean,
      coalesce((v_item->>'ordem')::int, 0)
    );
  end loop;

  return v_questao_id;
end;
$$;

-- Publica a prova — só depois de ter ao menos uma questão e um aluno
-- atribuído, senão o aluno abre uma prova vazia ou nunca vê nada.
create or replace function publicar_prova(p_prova_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (select 1 from provas where id = p_prova_id and professor_id = auth.uid()) then
    raise exception 'Prova não encontrada ou sem permissão.';
  end if;

  if not exists (select 1 from prova_questoes where prova_id = p_prova_id) then
    raise exception 'Adicione ao menos uma questão antes de publicar.';
  end if;

  if not exists (select 1 from prova_atribuicoes where prova_id = p_prova_id) then
    raise exception 'Atribua ao menos um aluno antes de publicar.';
  end if;

  update provas set status = 'publicada' where id = p_prova_id;
end;
$$;

-- Conteúdo da prova pro aluno responder — sem a coluna `correta`, que
-- nunca trafega pro cliente antes da correção. Substitui o select
-- direto em prova_alternativas (que o aluno não tem policy pra fazer).
create or replace function prova_para_responder(p_prova_id uuid)
returns table (
  questao_id uuid,
  enunciado text,
  questao_ordem int,
  pontos int,
  alternativa_id uuid,
  alternativa_texto text,
  alternativa_ordem int
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from provas p
    join prova_atribuicoes at on at.prova_id = p.id
    join alunos a on a.id = at.aluno_id
    where p.id = p_prova_id and p.status = 'publicada' and a.profile_id = auth.uid()
  ) then
    raise exception 'Prova não encontrada ou não atribuída a você.';
  end if;

  return query
    select pq.id, pq.enunciado, pq.ordem, pq.pontos, pa.id, pa.texto, pa.ordem
    from prova_questoes pq
    join prova_alternativas pa on pa.questao_id = pq.id
    where pq.prova_id = p_prova_id
    order by pq.ordem, pa.ordem;
end;
$$;

-- Recebe as respostas do aluno, valida, grava e devolve a nota já
-- corrigida — o cliente nunca precisa (nem consegue) ler `correta`
-- diretamente, nem antes nem depois da correção.
create or replace function submeter_prova(p_prova_id uuid, p_respostas jsonb)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  v_aluno_id uuid;
  v_total_questoes int;
  v_total_respostas int;
  v_item jsonb;
  v_questao_id uuid;
  v_alternativa_id uuid;
  v_nota int;
begin
  select a.id into v_aluno_id
  from alunos a
  join prova_atribuicoes at on at.aluno_id = a.id
  where at.prova_id = p_prova_id and a.profile_id = auth.uid();

  if v_aluno_id is null then
    raise exception 'Prova não encontrada ou não atribuída a você.';
  end if;

  if not exists (select 1 from provas where id = p_prova_id and status = 'publicada') then
    raise exception 'Esta prova não está disponível.';
  end if;

  if exists (select 1 from prova_respostas where prova_id = p_prova_id and aluno_id = v_aluno_id) then
    raise exception 'Você já respondeu esta prova.';
  end if;

  select count(*) into v_total_questoes from prova_questoes where prova_id = p_prova_id;
  select jsonb_array_length(p_respostas) into v_total_respostas;

  if v_total_questoes = 0 or v_total_respostas != v_total_questoes then
    raise exception 'Responda todas as questões antes de enviar.';
  end if;

  for v_item in select * from jsonb_array_elements(p_respostas) loop
    v_questao_id := (v_item->>'questao_id')::uuid;
    v_alternativa_id := (v_item->>'alternativa_id')::uuid;

    if not exists (
      select 1 from prova_alternativas pa
      join prova_questoes pq on pq.id = pa.questao_id
      where pa.id = v_alternativa_id and pa.questao_id = v_questao_id and pq.prova_id = p_prova_id
    ) then
      raise exception 'Resposta inválida.';
    end if;

    insert into prova_respostas (prova_id, aluno_id, questao_id, alternativa_escolhida_id)
    values (p_prova_id, v_aluno_id, v_questao_id, v_alternativa_id);
  end loop;

  select coalesce(sum(pq.pontos), 0) into v_nota
  from prova_respostas pr
  join prova_alternativas pa on pa.id = pr.alternativa_escolhida_id
  join prova_questoes pq on pq.id = pr.questao_id
  where pr.prova_id = p_prova_id and pr.aluno_id = v_aluno_id and pa.correta;

  update prova_atribuicoes
  set nota = v_nota, respondido_em = now()
  where prova_id = p_prova_id and aluno_id = v_aluno_id;

  return v_nota;
end;
$$;
