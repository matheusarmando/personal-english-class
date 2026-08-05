-- =========================================================
-- Migration: mais opções pré-definidas de plano no cadastro de
-- contrato (preenchendo a lacuna entre mensal e semestral).
-- =========================================================

insert into planos_config (tipo_plano, numero_parcelas, descricao) values
  ('bimestral', 2, 'Bimestral — 2 parcelas'),
  ('trimestral', 3, 'Trimestral — 3 parcelas');
