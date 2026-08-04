-- =========================================================
-- Migration: funções wrapper sobre o Supabase Vault pra
-- guardar/ler/atualizar/remover os tokens do Google. Só o
-- service_role pode executar (REVOKE explícito de public/anon/
-- authenticated) — mais restritivo que o padrão já usado no projeto
-- pras outras funções security definer, de propósito: aqui é onde
-- ficam os tokens de acesso à agenda pessoal do professor. Chamadas
-- só a partir do admin client (lib/supabase/admin.ts). Rode depois
-- do 0020.
-- =========================================================

create or replace function gcal_salvar_segredo(p_segredo text, p_nome text)
returns uuid
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  return vault.create_secret(p_segredo, p_nome);
end;
$$;

create or replace function gcal_ler_segredo(p_id uuid)
returns text
language sql
security definer
set search_path = public, vault
as $$
  select decrypted_secret from vault.decrypted_secrets where id = p_id;
$$;

create or replace function gcal_atualizar_segredo(p_id uuid, p_novo_valor text)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  perform vault.update_secret(p_id, p_novo_valor);
end;
$$;

create or replace function gcal_remover_segredo(p_id uuid)
returns void
language plpgsql
security definer
set search_path = public, vault
as $$
begin
  delete from vault.secrets where id = p_id;
end;
$$;

revoke execute on function gcal_salvar_segredo(text, text) from public, anon, authenticated;
revoke execute on function gcal_ler_segredo(uuid) from public, anon, authenticated;
revoke execute on function gcal_atualizar_segredo(uuid, text) from public, anon, authenticated;
revoke execute on function gcal_remover_segredo(uuid) from public, anon, authenticated;

grant execute on function gcal_salvar_segredo(text, text) to service_role;
grant execute on function gcal_ler_segredo(uuid) to service_role;
grant execute on function gcal_atualizar_segredo(uuid, text) to service_role;
grant execute on function gcal_remover_segredo(uuid) to service_role;
