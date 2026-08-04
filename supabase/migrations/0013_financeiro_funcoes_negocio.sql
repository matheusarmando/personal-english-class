-- =========================================================
-- Migration: funções de negócio do financeiro (todas security
-- definer, seguindo o padrão já usado em promover_usuario /
-- atualizar_dados_pessoais_aluno / solicitar_aula_publica). Nenhuma
-- escrita sensível acontece por policy de UPDATE direta — sempre por
-- aqui, com checagem de dono e de papel.
--
-- O cálculo de vencimento das parcelas (mês curto, virada de ano,
-- arredondamento de centavos) é feito em TypeScript
-- (`lib/financeiro/parcelas.ts`, testado com vitest) e passado pronto
-- pra estas funções via jsonb — evita duplicar essa lógica em duas
-- linguagens e manter as duas em sincronia.
--
-- Rode depois do 0012.
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
  p_parcelas jsonb
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
    dia_vencimento, observacoes
  )
  values (
    v_professor_id, p_aluno_id, p_tipo_plano, p_numero_parcelas,
    p_valor_total_centavos, p_valor_parcela_centavos, p_data_inicio,
    p_dia_vencimento, p_observacoes
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
  p_parcelas_abertas jsonb
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
      updated_at = now()
  where id = p_contrato_id;

  -- só regrava parcelas em aberto; 'paga' nunca é tocada aqui.
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

create or replace function cancelar_contrato(p_contrato_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professor_id uuid := auth.uid();
  v_antes jsonb;
begin
  if not exists (select 1 from contratos where id = p_contrato_id and professor_id = v_professor_id) then
    raise exception 'Contrato não encontrado ou sem permissão.';
  end if;

  select to_jsonb(c) into v_antes from contratos c where c.id = p_contrato_id;

  update contratos set status = 'cancelado', updated_at = now() where id = p_contrato_id;

  update parcelas set status = 'cancelada', updated_at = now()
  where contrato_id = p_contrato_id and status = 'pendente';

  insert into contrato_revisoes (contrato_id, alterado_por, dados_anteriores, dados_novos, motivo)
  values (
    p_contrato_id, v_professor_id, v_antes,
    (select to_jsonb(c) from contratos c where c.id = p_contrato_id),
    coalesce(p_motivo, 'Contrato cancelado')
  );
end;
$$;

-- Baixa manual de pagamento. Idempotente: reenviar a mesma
-- `p_idempotency_key` numa parcela já paga com essa chave é um no-op
-- silencioso, em vez de duplicar o evento — é o que permite plugar um
-- webhook de gateway aqui no futuro sem se preocupar com reentrega.
create or replace function registrar_pagamento_parcela(
  p_parcela_id uuid,
  p_valor_pago_centavos bigint,
  p_data_pagamento date,
  p_metodo_pagamento text,
  p_observacao text,
  p_idempotency_key text,
  p_provider text default 'manual',
  p_external_payment_id text default null
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professor_id uuid := auth.uid();
  v_parcela parcelas%rowtype;
begin
  select p.* into v_parcela
  from parcelas p
  join contratos c on c.id = p.contrato_id
  where p.id = p_parcela_id and c.professor_id = v_professor_id
  for update of p;

  if not found then
    raise exception 'Parcela não encontrada ou sem permissão.';
  end if;

  if v_parcela.idempotency_key is not null
     and v_parcela.idempotency_key = p_idempotency_key
     and v_parcela.status = 'paga' then
    return;
  end if;

  update parcelas
  set status = 'paga',
      data_pagamento = p_data_pagamento,
      valor_pago_centavos = p_valor_pago_centavos,
      metodo_pagamento = p_metodo_pagamento,
      observacao = p_observacao,
      provider = p_provider,
      external_payment_id = p_external_payment_id,
      idempotency_key = p_idempotency_key,
      updated_at = now()
  where id = p_parcela_id;

  insert into parcela_eventos (parcela_id, tipo, realizado_por, valor_centavos, metodo_pagamento, observacao, dados)
  values (
    p_parcela_id, 'baixa', v_professor_id, p_valor_pago_centavos, p_metodo_pagamento, p_observacao,
    jsonb_build_object('idempotency_key', p_idempotency_key, 'provider', p_provider)
  );
end;
$$;

create or replace function estornar_pagamento_parcela(p_parcela_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professor_id uuid := auth.uid();
  v_parcela parcelas%rowtype;
begin
  select p.* into v_parcela
  from parcelas p
  join contratos c on c.id = p.contrato_id
  where p.id = p_parcela_id and c.professor_id = v_professor_id
  for update of p;

  if not found then
    raise exception 'Parcela não encontrada ou sem permissão.';
  end if;

  if v_parcela.status != 'paga' then
    raise exception 'Só é possível estornar uma parcela paga.';
  end if;

  update parcelas
  set status = 'pendente',
      data_pagamento = null,
      valor_pago_centavos = null,
      metodo_pagamento = null,
      idempotency_key = null,
      updated_at = now()
  where id = p_parcela_id;

  insert into parcela_eventos (parcela_id, tipo, realizado_por, observacao)
  values (p_parcela_id, 'estorno', v_professor_id, p_motivo);
end;
$$;

create or replace function aprovar_comprovante(
  p_comprovante_id uuid,
  p_valor_pago_centavos bigint,
  p_data_pagamento date,
  p_metodo_pagamento text
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professor_id uuid := auth.uid();
  v_comprovante parcela_comprovantes%rowtype;
begin
  select pc.* into v_comprovante
  from parcela_comprovantes pc
  join parcelas p on p.id = pc.parcela_id
  join contratos c on c.id = p.contrato_id
  where pc.id = p_comprovante_id and c.professor_id = v_professor_id;

  if not found then
    raise exception 'Comprovante não encontrado ou sem permissão.';
  end if;

  update parcela_comprovantes
  set status = 'aprovado', revisado_por = v_professor_id, revisado_em = now()
  where id = p_comprovante_id;

  perform registrar_pagamento_parcela(
    v_comprovante.parcela_id,
    p_valor_pago_centavos,
    p_data_pagamento,
    coalesce(p_metodo_pagamento, 'comprovante'),
    'Baixa automática por aprovação de comprovante',
    'comprovante:' || v_comprovante.id::text,
    'manual',
    null
  );
end;
$$;

create or replace function rejeitar_comprovante(p_comprovante_id uuid, p_motivo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_professor_id uuid := auth.uid();
begin
  if not exists (
    select 1 from parcela_comprovantes pc
    join parcelas p on p.id = pc.parcela_id
    join contratos c on c.id = p.contrato_id
    where pc.id = p_comprovante_id and c.professor_id = v_professor_id
  ) then
    raise exception 'Comprovante não encontrado ou sem permissão.';
  end if;

  update parcela_comprovantes
  set status = 'rejeitado', revisado_por = v_professor_id, revisado_em = now(), motivo_rejeicao = p_motivo
  where id = p_comprovante_id;
end;
$$;
