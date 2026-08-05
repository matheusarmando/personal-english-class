-- =========================================================
-- Migration: corrige recursão infinita de RLS entre provas e
-- prova_atribuicoes.
--
-- provas_select_aluno (em provas) consulta prova_atribuicoes;
-- prova_atribuicoes_select_professor (em prova_atribuicoes) consultava
-- provas de volta — Postgres precisa avaliar TODAS as policies
-- permissivas de SELECT de uma tabela (não só a que "bateria"
-- primeiro), então esse ciclo vira "infinite recursion detected in
-- policy for relation provas" (42P17) assim que qualquer query toca
-- em provas ou prova_atribuicoes.
--
-- Fix: função SECURITY DEFINER (mesmo padrão de auth_role()) — como
-- ela roda com o dono da função (que tem BYPASSRLS), a consulta
-- interna a `provas` não reaciona a policy de novo, quebrando o ciclo.
-- =========================================================

create or replace function e_professor_dono_da_prova(p_prova_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from provas where id = p_prova_id and professor_id = auth.uid());
$$;

drop policy if exists "prova_atribuicoes_select_professor" on prova_atribuicoes;
create policy "prova_atribuicoes_select_professor" on prova_atribuicoes for select
  using (e_professor_dono_da_prova(prova_atribuicoes.prova_id));
