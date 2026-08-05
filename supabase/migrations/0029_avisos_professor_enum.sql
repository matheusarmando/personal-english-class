-- =========================================================
-- Migration: novo valor de enum pro tipo de notificação de aviso
-- geral do professor. Separado da migration seguinte (0030) porque o
-- Postgres não deixa usar um valor de enum recém-adicionado (em
-- comparação, política de RLS, etc.) na mesma transação em que ele
-- foi criado — mesmo padrão já usado na 0015 com tipo_mensagem_whatsapp.
-- =========================================================

alter type tipo_notificacao add value 'aviso_professor';
