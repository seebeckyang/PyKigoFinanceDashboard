-- ============================================================================
--  001_bootstrap.sql
--  建一個 admin_exec_sql function,之後所有 DDL 都透過此 function 跑
--  (這個檔本身由 GitHub Actions 跑一次,使用者完全不用碰 SQL Editor)
-- ============================================================================

create or replace function public.admin_exec_sql(sql text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  execute sql;
  return jsonb_build_object('ok', true);
exception when others then
  return jsonb_build_object(
    'ok', false,
    'error', SQLERRM,
    'state', SQLSTATE
  );
end;
$$;

revoke all on function public.admin_exec_sql(text) from public, anon, authenticated;
grant execute on function public.admin_exec_sql(text) to service_role;
