-- =========================================================
-- Migration: base de dados pra Fase 2 (escrita) da integração com
-- Google Calendar. google_event_id/google_event_etag em
-- aluno_horarios já existem desde a 0020 — só faltava o outbox
-- (status/tentativas/erro) pra acompanhar a sincronização de escrita
-- e a feature flag por conta pra rollout gradual (opt-in).
--
-- Padrão outbox in-row (não tabela separada): o volume de aulas por
-- professor é baixo o suficiente pra não justificar a complexidade de
-- uma fila dedicada — a própria linha de aluno_horarios carrega o
-- estado da sincronização.
-- =========================================================

create type status_sync_escrita_google as enum ('pendente', 'sincronizado', 'falhou');

alter table aluno_horarios
  add column google_sync_status status_sync_escrita_google,
  add column google_sync_tentativas int not null default 0,
  add column google_sync_ultimo_erro text;

-- Escrita começa desligada por padrão mesmo pra quem já conectou a
-- conta na Fase 1 (só leitura) — rollout é opt-in explícito por
-- professor, nunca automático pra quem já estava conectado antes.
alter table google_calendar_accounts
  add column escrita_habilitada boolean not null default false;
