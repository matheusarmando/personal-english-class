-- =========================================================
-- Migration: liga as notificações de parcela ao canal de WhatsApp já
-- existente, em vez de criar um sistema de envio paralelo. Rode
-- depois do 0014.
-- =========================================================

alter type tipo_mensagem_whatsapp add value 'parcela_lembrete';
alter type tipo_mensagem_whatsapp add value 'parcela_atraso';

alter table whatsapp_mensagens
  add column parcela_id uuid references parcelas (id) on delete set null;

-- Quantos dias antes do vencimento o professor quer que o aluno seja
-- avisado por WhatsApp. Configurável por professor (mesmo padrão do
-- whatsapp_ativo), não hardcoded na regra de negócio.
alter table profiles
  add column financeiro_dias_lembrete smallint not null default 3
    check (financeiro_dias_lembrete >= 0);

grant update (financeiro_dias_lembrete) on profiles to authenticated;
