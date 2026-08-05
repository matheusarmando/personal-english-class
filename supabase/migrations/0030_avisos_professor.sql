-- =========================================================
-- Migration: avisos gerais/individuais do professor pro aluno,
-- reaproveitando a tabela `notificacoes` (0014) em vez de criar uma
-- tabela nova — ela já tem RLS por destinatário e um enum de tipo.
-- Rode depois do 0029.
-- =========================================================

alter table notificacoes
  add column remetente_id uuid references profiles (id) on delete set null,
  add column envio_id uuid;

-- Um aviso "geral" gera um insert por aluno ativo (fan-out) — envio_id
-- agrupa essas linhas como um único envio na tela do professor, sem
-- precisar de uma tabela de "avisos" separada da de notificações.
create index notificacoes_envio_id_idx on notificacoes (envio_id) where envio_id is not null;

-- Só pra não obrigar a aplicação a calcular uma chave_idempotencia
-- manualmente pra cada linha do fan-out (as automações existentes
-- continuam livres pra passar a própria chave, como já fazem).
alter table notificacoes
  alter column chave_idempotencia set default gen_random_uuid()::text;

-- professor vê os avisos que ele mesmo publicou — sem isso ele não
-- teria acesso via select por destinatário, já que quem recebe é o
-- aluno, não ele.
create policy "notificacoes_select_professor_avisos"
  on notificacoes for select
  using (tipo = 'aviso_professor' and remetente_id = auth.uid());

-- só professor publica aviso, só marcado com o próprio id como
-- remetente, e só endereçado a alunos que são realmente dele.
create policy "notificacoes_insert_professor_avisos"
  on notificacoes for insert
  with check (
    auth_role() = 'professor'
    and tipo = 'aviso_professor'
    and remetente_id = auth.uid()
    and exists (
      select 1 from alunos a
      where a.profile_id = notificacoes.destinatario_id
        and a.professor_id = auth.uid()
    )
  );
