-- =========================================================
-- Migration: notificações in-app de vencimento/atraso de parcela.
-- A idempotência (não notificar duas vezes) é garantida pela unique
-- em `chave_idempotencia` — quem grava usa upsert com
-- `ignoreDuplicates`/`on conflict do nothing`, sem precisar checar
-- "já existe?" antes. Rode depois do 0013.
-- =========================================================

create type tipo_notificacao as enum (
  'parcela_a_vencer',
  'parcela_vence_hoje',
  'parcela_atrasada',
  'resumo_professor_vencimentos',
  'nova_inadimplencia'
);

create table notificacoes (
  id uuid primary key default gen_random_uuid(),
  destinatario_id uuid not null references profiles (id) on delete cascade,
  tipo tipo_notificacao not null,
  parcela_id uuid references parcelas (id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  lida boolean not null default false,
  lida_em timestamptz,
  chave_idempotencia text not null unique,
  created_at timestamptz not null default now()
);

create index notificacoes_destinatario_id_idx on notificacoes (destinatario_id, lida);

alter table notificacoes enable row level security;

-- Cada usuário só vê as próprias notificações.
create policy "notificacoes_select_proprio"
  on notificacoes for select
  using (destinatario_id = auth.uid());

-- Só pode marcar como lida a própria notificação — nenhum outro
-- campo é alterável por aqui (grant restrito por coluna, mesmo padrão
-- da 0007).
create policy "notificacoes_update_proprio"
  on notificacoes for update
  using (destinatario_id = auth.uid());

revoke update on notificacoes from authenticated;
grant update (lida, lida_em) on notificacoes to authenticated;

-- Inserção só pelo service role (cron/servidor) — sem policy de
-- insert pra `authenticated`, então usuários comuns não conseguem
-- forjar notificação pra si mesmos.
