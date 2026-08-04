-- =========================================================
-- Migration: habilita pg_cron/pg_net (já disponíveis no projeto,
-- só não ativados) pro job de fallback de sincronização a cada
-- 30min — o cron da Vercel (plano Hobby) só permite 1x/dia, então
-- não cobre esse caso.
--
-- pg_cron roda dentro do Postgres e não tem acesso a variáveis de
-- ambiente do Next.js, então guarda aqui a URL base do app e o
-- CRON_SECRET (mesmo segredo usado pelo cron do WhatsApp) numa
-- tabela com RLS deny-all — o blast radius desse segredo é baixo
-- (só autoriza chamar as próprias rotas de cron da aplicação, não dá
-- acesso a dado de usuário nenhum), diferente dos tokens do Google,
-- que ficam no Vault (0021).
--
-- O agendamento do job em si (`cron.schedule(...)`) NÃO entra numa
-- migration, porque depende da URL real do ambiente (dev/preview/
-- produção) — é um passo único documentado no README, rodado depois
-- do deploy. Rode esta migration depois do 0021.
-- =========================================================

create extension if not exists pg_cron;
-- pg_net não suporta `alter extension ... set schema`, então precisa
-- ser criado direto no schema certo pra não cair em "public"
-- (extensão em "public" é sinalizado pelo advisor de segurança).
create extension if not exists pg_net with schema extensions;

create table configuracao_sistema (
  chave text primary key,
  valor text not null,
  updated_at timestamptz not null default now()
);

alter table configuracao_sistema enable row level security;
-- sem policy pra authenticated/anon — deny-all, só service_role.
