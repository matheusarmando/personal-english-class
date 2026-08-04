-- =========================================================
-- Migration: corrige um bug real da 0017. CREATE OR REPLACE só
-- substitui uma função quando a lista de parâmetros é idêntica —
-- como a 0017 adicionou `p_pix_copia_cola` no final, ela na verdade
-- criou um SEGUNDO overload de criar_contrato/editar_contrato em vez
-- de substituir, deixando duas versões de cada (com e sem pix).
-- Isso já causou "function ... is not unique" em teste manual.
-- Remove os overloads antigos, mantendo só a versão com
-- pix_copia_cola. Rode depois do 0018.
-- =========================================================

drop function if exists criar_contrato(
  uuid, text, bigint, bigint, date, smallint, smallint, text, jsonb
);
drop function if exists editar_contrato(
  uuid, bigint, bigint, date, smallint, smallint, text, text, jsonb
);
