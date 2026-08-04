-- =========================================================
-- Migration: modelo de dados da integração com Google Calendar
-- (Fase 1 — leitura). Tokens NUNCA são gravados em texto aqui — as
-- colunas *_secret_id guardam o id do segredo no Supabase Vault
-- (extensão já instalada no projeto). RLS fica deny-all pra
-- authenticated/anon em todas as tabelas novas: todo acesso é via
-- service role, a partir de Server Components/Route Handlers.
-- Rode depois do 0019.
-- =========================================================

create type status_google_calendar_account as enum (
  'conectado', 'erro', 'reauth_necessario', 'desconectado'
);

create table google_calendar_accounts (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references profiles (id) on delete cascade,
  google_account_email text not null,
  access_token_secret_id uuid,
  refresh_token_secret_id uuid,
  token_expires_at timestamptz,
  scopes text[] not null default '{}',
  primary_calendar_id text,
  -- quais calendários da conta contam pra cálculo de ocupação
  -- (requisito 1.4) — vazio = só o primário.
  calendarios_selecionados text[] not null default '{}',
  -- sync_token do Google é por calendário, não por conta — um mapa
  -- {calendarId: syncToken}, já que o professor pode selecionar mais
  -- de um calendário.
  sync_tokens jsonb not null default '{}'::jsonb,
  watch_channel_id text,
  watch_resource_id text,
  watch_channel_token_secret_id uuid,
  watch_expires_at timestamptz,
  status status_google_calendar_account not null default 'conectado',
  ignorar_dia_inteiro boolean not null default false,
  ocultar_titulo_para_aluno boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professor_id)
);

create index google_calendar_accounts_professor_id_idx on google_calendar_accounts (professor_id);

-- Espelho local dos eventos do Google — somente leitura pra
-- aplicação (nunca é a fonte de verdade, o Google é).
create table google_calendar_events (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references google_calendar_accounts (id) on delete cascade,
  google_event_id text not null,
  calendar_id text not null,
  title text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  is_all_day boolean not null default false,
  timezone text,
  transparency text not null default 'opaque',
  status text not null default 'confirmed',
  attendee_response text,
  etag text,
  updated_at timestamptz not null default now(),
  raw jsonb,
  created_at timestamptz not null default now(),
  unique (account_id, google_event_id)
);

create index google_calendar_events_account_id_idx on google_calendar_events (account_id);
create index google_calendar_events_periodo_idx on google_calendar_events (account_id, starts_at, ends_at);

create table google_sync_logs (
  id uuid primary key default gen_random_uuid(),
  account_id uuid references google_calendar_accounts (id) on delete cascade,
  tipo_operacao text not null,
  resultado text not null,
  erro text,
  duracao_ms integer,
  created_at timestamptz not null default now()
);

create index google_sync_logs_account_id_idx on google_sync_logs (account_id, created_at desc);

alter table google_calendar_accounts enable row level security;
alter table google_calendar_events enable row level security;
alter table google_sync_logs enable row level security;

-- Nenhuma policy criada de propósito: deny-all real pra
-- authenticated/anon. service_role (BYPASSRLS) continua acessando
-- normalmente a partir do admin client.

-- Timezone do professor — necessário pra comparar horários locais
-- de aula com os horários RFC3339 com offset que o Google devolve.
alter table profiles
  add column timezone text not null default 'America/Sao_Paulo';

-- Colunas de preparo pra Fase 2 (escrita no Google), pedidas
-- explicitamente no prompt pra não exigir nova migration depois.
-- Não usadas nesta fase.
alter table aluno_horarios
  add column google_event_id text,
  add column google_event_etag text;
