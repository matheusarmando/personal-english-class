-- =========================================================
-- Migration: PIX copia e cola por contrato. O modelo antigo tinha
-- esse campo por aluno (alunos.pix_copia_cola); no novo modelo, cada
-- contrato pode ter uma chave diferente (ex.: reajuste com conta
-- nova). Rode depois do 0015.
-- =========================================================

alter table contratos add column pix_copia_cola text;
