-- =========================================================
-- Migration: log de baixa/estorno de pagamento e comprovantes
-- enviados pelo aluno (upload em Supabase Storage). Rode depois do
-- 0011.
-- =========================================================

create type tipo_evento_parcela as enum ('baixa', 'estorno');

-- Auditoria de quem deu baixa/estornou uma parcela e quando. Nunca é
-- escrito diretamente pela API — só pelas funções security definer
-- da próxima migration.
create table parcela_eventos (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references parcelas (id) on delete cascade,
  tipo tipo_evento_parcela not null,
  realizado_por uuid references profiles (id),
  realizado_em timestamptz not null default now(),
  valor_centavos bigint,
  metodo_pagamento text,
  observacao text,
  dados jsonb
);

create index parcela_eventos_parcela_id_idx on parcela_eventos (parcela_id);

create type status_comprovante as enum ('pendente', 'aprovado', 'rejeitado');

create table parcela_comprovantes (
  id uuid primary key default gen_random_uuid(),
  parcela_id uuid not null references parcelas (id) on delete cascade,
  enviado_por uuid not null references profiles (id),
  arquivo_path text not null,
  nome_arquivo text,
  tipo_arquivo text,
  tamanho_bytes integer,
  status status_comprovante not null default 'pendente',
  revisado_por uuid references profiles (id),
  revisado_em timestamptz,
  motivo_rejeicao text,
  created_at timestamptz not null default now()
);

create index parcela_comprovantes_parcela_id_idx on parcela_comprovantes (parcela_id);

alter table parcela_eventos enable row level security;
alter table parcela_comprovantes enable row level security;

create policy "parcela_eventos_select_prof_ou_gestor"
  on parcela_eventos for select
  using (
    exists (
      select 1 from parcelas p
      join contratos c on c.id = p.contrato_id
      where p.id = parcela_eventos.parcela_id
        and (c.professor_id = auth.uid() or auth_role() = 'gestor')
    )
  );

create policy "parcela_comprovantes_select_prof_gestor_ou_aluno"
  on parcela_comprovantes for select
  using (
    exists (
      select 1 from parcelas p
      join contratos c on c.id = p.contrato_id
      join alunos a on a.id = c.aluno_id
      where p.id = parcela_comprovantes.parcela_id
        and (
          c.professor_id = auth.uid()
          or auth_role() = 'gestor'
          or a.profile_id = auth.uid()
        )
    )
  );

-- Aluno pode enviar comprovante pra própria parcela; professor/gestor
-- não inserem por aqui (fluxo deles é aprovar/rejeitar, via função
-- security definer na próxima migration).
create policy "parcela_comprovantes_insert_aluno"
  on parcela_comprovantes for insert
  with check (
    enviado_por = auth.uid()
    and exists (
      select 1 from parcelas p
      join contratos c on c.id = p.contrato_id
      join alunos a on a.id = c.aluno_id
      where p.id = parcela_comprovantes.parcela_id
        and a.profile_id = auth.uid()
    )
  );

-- Bucket privado pra comprovante de pagamento. Sem acesso público;
-- tudo passa por policy em storage.objects.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'comprovantes-financeiro',
  'comprovantes-financeiro',
  false,
  5242880, -- 5MB
  array['image/jpeg', 'image/png', 'application/pdf']
)
on conflict (id) do nothing;

-- Caminho esperado: {parcela_id}/{arquivo}. O aluno só sobe pra pasta
-- da própria parcela; professor/gestor leem qualquer parcela do
-- próprio contrato.
create policy "comprovantes_storage_insert_aluno"
  on storage.objects for insert
  with check (
    bucket_id = 'comprovantes-financeiro'
    and exists (
      select 1 from parcelas p
      join contratos c on c.id = p.contrato_id
      join alunos a on a.id = c.aluno_id
      where p.id::text = (storage.foldername(name))[1]
        and a.profile_id = auth.uid()
    )
  );

create policy "comprovantes_storage_select_prof_gestor_ou_aluno"
  on storage.objects for select
  using (
    bucket_id = 'comprovantes-financeiro'
    and exists (
      select 1 from parcelas p
      join contratos c on c.id = p.contrato_id
      join alunos a on a.id = c.aluno_id
      where p.id::text = (storage.foldername(name))[1]
        and (
          c.professor_id = auth.uid()
          or auth_role() = 'gestor'
          or a.profile_id = auth.uid()
        )
    )
  );
