-- =========================================================
-- Migration: migra os dados do financeiro simples antigo
-- (alunos.valor/dia_vencimento/status_pagamento/pix_copia_cola) pro
-- novo modelo de contratos/parcelas. Cria 1 contrato mensal + 1
-- parcela pra cada aluno que ainda tem esses campos preenchidos e
-- ainda não tem nenhum contrato — idempotente, pode rodar mais de
-- uma vez sem duplicar. Os campos antigos em `alunos` continuam
-- existindo (não são apagados), só deixam de ser a fonte de verdade.
-- Rode depois do 0017.
-- =========================================================

do $$
declare
  v_aluno record;
  v_contrato_id uuid;
  v_data_inicio date;
  v_ultimo_dia_mes int;
  v_vencimento date;
begin
  for v_aluno in
    select a.*
    from alunos a
    where a.valor is not null
      and a.dia_vencimento is not null
      and not exists (select 1 from contratos c where c.aluno_id = a.id)
  loop
    v_data_inicio := coalesce(v_aluno.created_at::date, current_date);
    v_ultimo_dia_mes := extract(
      day from (date_trunc('month', v_data_inicio) + interval '1 month - 1 day')
    )::int;
    v_vencimento := make_date(
      extract(year from v_data_inicio)::int,
      extract(month from v_data_inicio)::int,
      least(v_aluno.dia_vencimento, v_ultimo_dia_mes)
    );

    insert into contratos (
      professor_id, aluno_id, tipo_plano, numero_parcelas,
      valor_total_centavos, valor_parcela_centavos, data_inicio,
      dia_vencimento, status, pix_copia_cola, observacoes
    ) values (
      v_aluno.professor_id, v_aluno.id, 'mensal', 1,
      round(v_aluno.valor * 100), round(v_aluno.valor * 100),
      v_data_inicio, v_aluno.dia_vencimento,
      case when v_aluno.ativo then 'ativo' else 'cancelado' end,
      v_aluno.pix_copia_cola,
      'Contrato gerado automaticamente na migração do módulo financeiro.'
    )
    returning id into v_contrato_id;

    insert into parcelas (
      contrato_id, numero, valor_centavos, vencimento, status, data_pagamento, valor_pago_centavos
    ) values (
      v_contrato_id, 1, round(v_aluno.valor * 100), v_vencimento,
      case when v_aluno.status_pagamento = 'pago' then 'paga' else 'pendente' end,
      case when v_aluno.status_pagamento = 'pago' then current_date else null end,
      case when v_aluno.status_pagamento = 'pago' then round(v_aluno.valor * 100) else null end
    );
  end loop;
end $$;
