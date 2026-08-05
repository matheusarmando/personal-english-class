-- =========================================================
-- Migration: hardening de AppSec (revisão de segurança)
-- 1) auth_role() e link_aluno_por_email() são SECURITY DEFINER
--    sem search_path fixo — vetor clássico de escalonamento de
--    privilégio em Postgres (o search_path da SESSÃO de quem chama
--    afeta a resolução de nomes dentro da função). auth_role() em
--    particular é o primitivo usado em quase toda policy de RLS do
--    projeto, então travar isso é a correção de maior alcance.
-- 2) turmas_insert_professor_ou_gestor não amarrava professor_id ao
--    chamador — só checava o role, não a posse — permitindo que
--    qualquer professor criasse turma em nome de outro professor via
--    REST direto (bypassando a UI, que sempre manda o id certo).
-- =========================================================

alter function public.auth_role() set search_path = public, pg_temp;
alter function public.link_aluno_por_email() set search_path = public, pg_temp;

drop policy if exists turmas_insert_professor_ou_gestor on turmas;
create policy turmas_insert_professor_ou_gestor on turmas
  for insert
  with check (
    (professor_id = auth.uid() and auth_role() = 'professor'::user_role)
    or auth_role() = 'gestor'::user_role
  );
