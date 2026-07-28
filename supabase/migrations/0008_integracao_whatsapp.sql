-- =========================================================
-- Migration: integração com WhatsApp (Meta Cloud API)
-- Rode isso no SQL editor do Supabase depois do 0007.
-- =========================================================

-- Liga/desliga, por professor, o envio automático de mensagens. O
-- número de WhatsApp em si é único da plataforma (configurado uma
-- vez no servidor via env vars), não por professor.
alter table profiles
  add column whatsapp_ativo boolean not null default false;

grant update (whatsapp_ativo) on profiles to authenticated;

-- Dia do mês em que a mensalidade do aluno vence (1-31), usado pro
-- lembrete de cobrança "vence amanhã".
alter table alunos
  add column dia_vencimento smallint check (dia_vencimento between 1 and 31);

-- Status e anotações da aula, usados pro resumo pós-aula.
create type status_aluno_horario as enum ('agendada', 'concluida', 'cancelada');

alter table aluno_horarios
  add column status status_aluno_horario not null default 'agendada',
  add column conteudo text,
  add column exercicio text;

-- Faltava uma policy de UPDATE pro professor em aluno_horarios
-- (só existiam select/insert/delete) — necessária pra marcar a aula
-- como concluída e registrar conteúdo/exercício.
create policy "aluno_horarios_update_professor_ou_gestor"
  on aluno_horarios for update
  using (
    exists (
      select 1 from alunos a
      where a.id = aluno_horarios.aluno_id
        and (a.professor_id = auth.uid() or auth_role() = 'gestor')
    )
  );

-- =========================================================
-- Fila/log de mensagens de WhatsApp
-- =========================================================

create type tipo_mensagem_whatsapp as enum ('lembrete_aula', 'resumo_aula', 'cobranca');
create type status_mensagem_whatsapp as enum ('pendente', 'enviada', 'falhou');

create table whatsapp_mensagens (
  id uuid primary key default gen_random_uuid(),
  professor_id uuid not null references profiles (id) on delete cascade,
  aluno_id uuid references alunos (id) on delete cascade,
  aluno_horario_id uuid references aluno_horarios (id) on delete set null,
  tipo tipo_mensagem_whatsapp not null,
  destinatario_telefone text not null,
  conteudo text not null,
  status status_mensagem_whatsapp not null default 'pendente',
  whatsapp_message_id text,
  erro text,
  agendado_para timestamptz not null,
  enviado_em timestamptz,
  created_at timestamptz not null default now()
);

alter table whatsapp_mensagens enable row level security;

create policy "whatsapp_mensagens_select_prof_ou_gestor"
  on whatsapp_mensagens for select
  using (professor_id = auth.uid() or auth_role() = 'gestor');

-- Inserts/updates nas mensagens são feitos pelo cron/webhook usando a
-- service role key (que ignora RLS) — não há policy de insert/update
-- para o role "authenticated" de propósito, pra que só o backend do
-- sistema possa gravar entradas na fila.
