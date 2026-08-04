-- =========================================================
-- Migration: propaga pix_copia_cola (adicionado na 0016) para as
-- funções de criação/edição de contrato. Parâmetro novo no final com
-- default, então é um create or replace válido — não quebra nenhuma
-- chamada existente. Rode depois do 0016.
-- =========================================================

create or replace function criar_contrato(
  p_aluno_id uuid,
  p_tipo_plano text,
  p_valor_total_centavos bigint,
  p_valor_parcela_centavos bigint,
  p_data_inicio date,
  p_dia_vencimento smallint,
  p_numero_parcelas smallint,
  p_observacoes text,
  p_parcelas jsonb,
  p_pix_copia_cola text default null
) returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professor_id uuid := auth.uid();
  v_contrato_id uuid;
  v_item jsonb;
begin
  if auth_role() != 'professor' then
    raise exception 'Apenas professores podem criar contratos.';
  end if;

  if not exists (select 1 from alunos where id = p_aluno_id and professor_id = v_professor_id) then
    raise exception 'Aluno não encontrado ou não pertence a este professor.';
  end if;

  insert into contratos (
    professor_id, aluno_id, tipo_plano, numero_parcelas,
    valor_total_centavos, valor_parcela_centavos, data_inicio,
    dia_vencimento, observacoes, pix_copia_cola
  )
  values (
    v_professor_id, p_aluno_id, p_tipo_plano, p_numero_parcelas,
    p_valor_total_centavos, p_valor_parcela_centavos, p_data_inicio,
    p_dia_vencimento, p_observacoes, p_pix_copia_cola
  )
  returning id into v_contrato_id;

  for v_item in select * from jsonb_array_elements(p_parcelas) loop
    insert into parcelas (contrato_id, numero, valor_centavos, vencimento)
    values (
      v_contrato_id,
      (v_item->>'numero')::smallint,
      (v_item->>'valor_centavos')::bigint,
      (v_item->>'vencimento')::date
    );
  end loop;

  return v_contrato_id;
end;
$$;

create or replace function editar_contrato(
  p_contrato_id uuid,
  p_valor_total_centavos bigint,
  p_valor_parcela_centavos bigint,
  p_data_inicio date,
  p_dia_vencimento smallint,
  p_numero_parcelas smallint,
  p_observacoes text,
  p_motivo text,
  p_parcelas_abertas jsonb,
  p_pix_copia_cola text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professor_id uuid := auth.uid();
  v_antes jsonb;
  v_item jsonb;
begin
  if not exists (select 1 from contratos where id = p_contrato_id and professor_id = v_professor_id) then
    raise exception 'Contrato não encontrado ou sem permissão.';
  end if;

  select to_jsonb(c) into v_antes from contratos c where c.id = p_contrato_id;

  update contratos
  set valor_total_centavos = p_valor_total_centavos,
      valor_parcela_centavos = p_valor_parcela_centavos,
      data_inicio = p_data_inicio,
      dia_vencimento = p_dia_vencimento,
      numero_parcelas = p_numero_parcelas,
      observacoes = p_observacoes,
      pix_copia_cola = coalesce(p_pix_copia_cola, pix_copia_cola),
      updated_at = now()
  where id = p_contrato_id;

  delete from parcelas where contrato_id = p_contrato_id and status in ('pendente', 'cancelada');

  for v_item in select * from jsonb_array_elements(p_parcelas_abertas) loop
    insert into parcelas (contrato_id, numero, valor_centavos, vencimento)
    values (
      p_contrato_id,
      (v_item->>'numero')::smallint,
      (v_item->>'valor_centavos')::bigint,
      (v_item->>'vencimento')::date
    );
  end loop;

  insert into contrato_revisoes (contrato_id, alterado_por, dados_anteriores, dados_novos, motivo)
  values (
    p_contrato_id, v_professor_id, v_antes,
    (select to_jsonb(c) from contratos c where c.id = p_contrato_id),
    p_motivo
  );
end;
$$;
