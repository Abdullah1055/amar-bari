-- Manual rollback only (destroys profiles, permissions and audit history). Never run in production without a backup.
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.manager_permissions, public.audit_logs, public.permissions, public.profiles cascade;
drop function if exists public.handle_new_user(), public.profiles_guard(), public.audit_logs_append_only(),
  public.audit_write(uuid, text, text, text, text, jsonb), public.current_app_role(), public.is_super_admin(),
  public.has_permission(text), public.approve_manager(uuid), public.set_user_status(uuid, public.account_status, text),
  public.grant_manager_permission(uuid, text, text), public.revoke_manager_permission(uuid, text, text),
  public.log_manager_invited(uuid), public.bootstrap_super_admin(uuid);
drop type if exists public.account_status, public.app_role;
