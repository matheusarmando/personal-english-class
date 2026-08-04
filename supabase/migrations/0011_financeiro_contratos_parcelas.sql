-- =========================================================
-- Migration: módulo financeiro — contratos e parcelas.
-- Substitui o financeiro simples (alunos.valor/status_pagamento/
-- dia_vencimento/pix_copia_cola) por contratos com plano
-- (mensal/semestral/anual) que geram parcelas automaticamente.
-- As colunas antigas em `alunos` NÃO são removidas aqui (deixam de
-- ser a fonte de verdade, mas nada é apagado). Rode depois do 0010.
-- =========================================================

-- Mapeia tipo de plano -> número de parcelas. A regra de negócio lê
-- daqui em vez de hardcodar num switch/case no código da aplicação.
create table planos_config (
  tipo_plano text primary key,
  numero_parcelas smallint not null check (numero_parcelas >= 1),
  descricao text
);

insert into planos_config (tipo_plano, numero_parcelas, descricao) values
  ('mensal', 1, 'Mensal — 1 parcela, renovável'),
  ('semestral', 6, 'Semestral — 6 parcelas'),
  ('anual', 12, 'Anual — 12 parcelas');

create type status_contrato as enum ('ativo', 'concluido', 'cancelado');

create table contratos (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references profiles (id) on delete cascade,
  aluno_id uuid not null references alunos (id) on delete cascade,
  tipo_plano text not null references planos_config (tipo_plano),
  numero_parcelas smallint not null check (numero_parcelas >= 1),
  valor_total_centavos bigint not null check (valor_total_centavos >= 0),
  valor_parcela_centavos bigint not null check (valor_parcela_centavos >= 0),
  data_inicio date not null,
  dia_vencimento smallint not null check (dia_vencimento between 1 and 31),
  status status_contrato not null default 'ativo',
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Histórico de edição do contrato (requisito: editar sem corromper
-- parcelas pagas e registrar o histórico da alteração).
create table contrato_revisoes (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  alterado_por uuid references profiles (id),
  alterado_em timestamptz not null default now(),
  dados_anteriores jsonb not null,
  dados_novos jsonb not null,
  motivo text
);

-- O status "atrasada" nunca é gravado por código da aplicação — só
-- 'pendente'/'paga'/'cancelada' são escritos. 'atrasada' existe no
-- enum pra permitir filtro direto na view abaixo, mas é sempre
-- derivado da data de vencimento (ver `parcelas_com_status_efetivo`).
create type status_parcela as enum ('pendente', 'paga', 'atrasada', 'cancelada');

create table parcelas (
  id uuid primary key default gen_random_uuid(),
  contrato_id uuid not null references contratos (id) on delete cascade,
  numero smallint not null check (numero >= 1),
  valor_centavos bigint not null check (valor_centavos >= 0),
  vencimento date not null,
  status status_parcela not null default 'pendente',
  data_pagamento date,
  valor_pago_centavos bigint,
  metodo_pagamento text,
  observacao text,
  -- campos pra preparar a integração futura com gateway de pagamento
  provider text not null default 'manual',
  external_payment_id text,
  payment_link text,
  idempotency_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (contrato_id, numero)
);

create index parcelas_contrato_id_idx on parcelas (contrato_id);
create index parcelas_vencimento_idx on parcelas (vencimento);
create index contratos_professor_id_idx on contratos (professor_id);
create index contratos_aluno_id_idx on contratos (aluno_id);

-- View de leitura: status efetivo calculado em tempo de consulta, sem
-- depender de nenhum job pra "virar" atrasada. Toda tela/dashboard lê
-- daqui, nunca da coluna `parcelas.status` crua.
create view parcelas_com_status_efetivo as
select
  p.*,
  case
    when p.status = 'pendente' and p.vencimento < current_date then 'atrasada'::status_parcela
    else p.status
  end as status_efetivo
from parcelas p;

-- security_invoker: sem isso, a view (criada pelo role postgres, que
-- tem BYPASSRLS) ignoraria a RLS de `parcelas` pra QUALQUER usuário
-- que a consultasse — vazando parcelas de todo mundo. Com isso, a
-- view respeita a RLS de quem está consultando, igual a tabela base.
alter view parcelas_com_status_efetivo set (security_invoker = true);

-- Views não herdam GRANT automaticamente; a RLS de `parcelas` já
-- restringe as linhas por usuário, isso só libera o acesso ao objeto.
grant select on parcelas_com_status_efetivo to authenticated;

alter table planos_config enable row level security;
alter table contratos enable row level security;
alter table contrato_revisoes enable row level security;
alter table parcelas enable row level security;

-- planos_config: leitura pública pra quem está logado (é só config,
-- sem dado sensível); escrita nenhuma pela API (mantido via migration).
create policy "planos_config_select_authenticated"
  on planos_config for select
  to authenticated
  using (true);

-- contratos: professor dono ou gestor veem/gerenciam; aluno só lê o
-- próprio. Toda escrita passa por função security definer (ver
-- migration seguinte), então não há policy de insert/update aberta.
create policy "contratos_select_prof_gestor_ou_aluno"
  on contratos for select
  using (
    professor_id = auth.uid()
    or auth_role() = 'gestor'
    or exists (
      select 1 from alunos a
      where a.id = contratos.aluno_id and a.profile_id = auth.uid()
    )
  );

create policy "contrato_revisoes_select_prof_ou_gestor"
  on contrato_revisoes for select
  using (
    exists (
      select 1 from contratos c
      where c.id = contrato_revisoes.contrato_id
        and (c.professor_id = auth.uid() or auth_role() = 'gestor')
    )
  );

-- parcelas: mesma visibilidade do contrato relacionado.
create policy "parcelas_select_prof_gestor_ou_aluno"
  on parcelas for select
  using (
    exists (
      select 1 from contratos c
      join alunos a on a.id = c.aluno_id
      where c.id = parcelas.contrato_id
        and (
          c.professor_id = auth.uid()
          or auth_role() = 'gestor'
          or a.profile_id = auth.uid()
        )
    )
  );
