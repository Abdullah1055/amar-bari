-- Amar Bari — Phase 1 foundation: four core roles, profiles, manager permissions, audit log.
-- Exactly four core roles. Adding a role value requires explicit product approval.

create type public.app_role as enum ('super_admin', 'manager', 'bari_ala', 'varatiye');
create type public.account_status as enum ('pending', 'active', 'suspended');

-- Defaults: nothing is exposed unless granted explicitly below.
alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

-- ---------------------------------------------------------------- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.app_role not null,
  status public.account_status not null default 'active',
  full_name text check (full_name is null or char_length(full_name) between 1 and 120),
  phone text check (phone is null or phone ~ '^\+?[0-9]{7,15}$'),
  preferred_language text not null default 'bn' check (preferred_language in ('bn', 'en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index profiles_role_idx on public.profiles (role);

-- ------------------------------------------------------ permission catalogue
create table public.permissions (
  key text primary key,
  description text not null
);
insert into public.permissions (key, description) values
  ('users.view',           'View landlord and tenant account profiles'),
  ('users.support',        'Handle user support requests'),
  ('accounts.review',      'Review account approvals and issues'),
  ('complaints.escalate',  'Handle escalated complaints'),
  ('subscriptions.review', 'Review subscription status'),
  ('payments.review',      'Review payment disputes'),
  ('reports.view',         'View platform reports');

create table public.manager_permissions (
  manager_id uuid not null references public.profiles (id) on delete cascade,
  permission_key text not null references public.permissions (key),
  granted_by uuid not null,
  granted_at timestamptz not null default now(),
  primary key (manager_id, permission_key)
);

-- --------------------------------------------------------------- audit log
create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid,
  action text not null,
  resource_type text not null,
  resource_id text,
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

create function public.audit_logs_append_only() returns trigger
language plpgsql set search_path = '' as $$
begin
  raise exception 'audit_logs is append-only' using errcode = '42501';
end $$;
create trigger audit_logs_no_update_delete before update or delete on public.audit_logs
  for each row execute function public.audit_logs_append_only();
create trigger audit_logs_no_truncate before truncate on public.audit_logs
  for each statement execute function public.audit_logs_append_only();

create function public.audit_write(
  p_actor uuid, p_action text, p_type text, p_id text, p_reason text, p_meta jsonb default '{}'::jsonb
) returns void language sql security definer set search_path = '' as $$
  insert into public.audit_logs (actor_id, action, resource_type, resource_id, reason, metadata)
  values (p_actor, p_action, p_type, p_id, p_reason, coalesce(p_meta, '{}'::jsonb));
$$;

-- ------------------------------------------------------- authorization helpers
create function public.current_app_role() returns public.app_role
language sql stable security definer set search_path = '' as $$
  select p.role from public.profiles p where p.id = auth.uid() and p.status = 'active';
$$;

create function public.is_super_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select coalesce(public.current_app_role() = 'super_admin', false);
$$;

create function public.has_permission(p_key text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1
    from public.profiles p
    join public.manager_permissions mp on mp.manager_id = p.id
    where p.id = auth.uid() and p.role = 'manager' and p.status = 'active'
      and mp.permission_key = p_key
  );
$$;

-- --------------------------------------------- signup: safe role provisioning
-- Public signup may only choose bari_ala or varatiye (user_metadata is client-controlled).
-- Managers come only from the server-side admin API via app_metadata.provisioned_role,
-- start as 'pending', and need Super Admin approval. Super Admin is never created here.
create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_role public.app_role;
  v_status public.account_status := 'active';
  v_app text := new.raw_app_meta_data ->> 'provisioned_role';
  v_user text := new.raw_user_meta_data ->> 'role';
begin
  if v_app is not null then
    if v_app <> 'manager' then
      raise exception 'invalid_provisioned_role' using errcode = '22023';
    end if;
    v_role := 'manager';
    v_status := 'pending';
  elsif v_user in ('bari_ala', 'varatiye') then
    v_role := v_user::public.app_role;
  else
    raise exception 'invalid_signup_role' using errcode = '22023';
  end if;

  insert into public.profiles (id, role, status, full_name)
  values (new.id, v_role, v_status, nullif(left(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')), 120), ''));

  perform public.audit_write(new.id, 'profile.created', 'profile', new.id::text, null,
    jsonb_build_object('role', v_role, 'status', v_status));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Defence in depth: end users can never change role/status/id, even if a grant slips.
create function public.profiles_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user in ('authenticated', 'anon')
     and (new.role is distinct from old.role or new.status is distinct from old.status or new.id is distinct from old.id) then
    raise exception 'role and status are managed by trusted functions only' using errcode = '42501';
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger profiles_guard before update on public.profiles
  for each row execute function public.profiles_guard();

-- ----------------------------------------------------- trusted admin functions
create function public.approve_manager(p_manager_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  update public.profiles set status = 'active'
   where id = p_manager_id and role = 'manager' and status = 'pending';
  if not found then
    raise exception 'no_pending_manager' using errcode = 'P0002';
  end if;
  perform public.audit_write(auth.uid(), 'manager.approved', 'profile', p_manager_id::text, null, '{}'::jsonb);
end $$;

create function public.set_user_status(p_user_id uuid, p_status public.account_status, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_target public.app_role;
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if p_status = 'pending' then
    raise exception 'invalid_status' using errcode = '22023';
  end if;
  if p_reason is null or btrim(p_reason) = '' then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  select role into v_target from public.profiles where id = p_user_id;
  if v_target is null then
    raise exception 'user_not_found' using errcode = 'P0002';
  end if;
  if v_target = 'super_admin' then
    raise exception 'cannot_change_super_admin' using errcode = '42501';
  end if;
  update public.profiles set status = p_status where id = p_user_id;
  perform public.audit_write(auth.uid(), 'user.status_changed', 'profile', p_user_id::text, p_reason,
    jsonb_build_object('status', p_status));
end $$;

create function public.grant_manager_permission(p_manager_id uuid, p_key text, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_manager_id and role = 'manager') then
    raise exception 'target_not_manager' using errcode = '22023';
  end if;
  insert into public.manager_permissions (manager_id, permission_key, granted_by)
  values (p_manager_id, p_key, auth.uid())
  on conflict do nothing;
  perform public.audit_write(auth.uid(), 'manager.permission_granted', 'profile', p_manager_id::text, p_reason,
    jsonb_build_object('permission', p_key));
end $$;

create function public.revoke_manager_permission(p_manager_id uuid, p_key text, p_reason text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  delete from public.manager_permissions where manager_id = p_manager_id and permission_key = p_key;
  perform public.audit_write(auth.uid(), 'manager.permission_revoked', 'profile', p_manager_id::text, p_reason,
    jsonb_build_object('permission', p_key));
end $$;


create function public.log_manager_invited(p_manager_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_super_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if not exists (select 1 from public.profiles where id = p_manager_id and role = 'manager' and status = 'pending') then
    raise exception 'no_pending_manager' using errcode = 'P0002';
  end if;
  perform public.audit_write(auth.uid(), 'manager.invited', 'profile', p_manager_id::text, null, '{}'::jsonb);
end $$;

-- One-time founder bootstrap. service_role only (run from the SQL editor / a server script).
create function public.bootstrap_super_admin(p_user_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set role = 'super_admin', status = 'active' where id = p_user_id;
  if not found then
    raise exception 'profile_not_found' using errcode = 'P0002';
  end if;
  perform public.audit_write(null, 'super_admin.bootstrapped', 'profile', p_user_id::text, 'initial platform owner', '{}'::jsonb);
end $$;


-- ---------------------------------------------------------------------- RLS
alter table public.profiles enable row level security;
alter table public.permissions enable row level security;
alter table public.manager_permissions enable row level security;
alter table public.audit_logs enable row level security;

revoke all on public.profiles, public.permissions, public.manager_permissions, public.audit_logs from anon, authenticated;
grant select on public.profiles, public.permissions, public.manager_permissions, public.audit_logs to authenticated;
grant update (full_name, phone, preferred_language) on public.profiles to authenticated;

create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid());
create policy profiles_select_super_admin on public.profiles for select to authenticated
  using (public.is_super_admin());
create policy profiles_select_manager_users_view on public.profiles for select to authenticated
  using (public.has_permission('users.view') and role in ('bari_ala', 'varatiye'));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid() and status = 'active')
  with check (id = auth.uid());

create policy permissions_select on public.permissions for select to authenticated using (true);

create policy manager_permissions_select_own on public.manager_permissions for select to authenticated
  using (manager_id = auth.uid());
create policy manager_permissions_select_super_admin on public.manager_permissions for select to authenticated
  using (public.is_super_admin());

create policy audit_logs_select_super_admin on public.audit_logs for select to authenticated
  using (public.is_super_admin());

-- ------------------------------------------------------------ function grants
-- Postgres grants EXECUTE to PUBLIC on new functions by default, and a schema-scoped
-- default-privilege revoke cannot remove that. Revoke explicitly, then grant narrowly.
-- Convention: every future migration that adds a function must end with its own revoke + grant.
do $$
declare r record;
begin
  for r in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.prokind = 'f'
  loop
    execute format('revoke all on function %s from public, anon, authenticated', r.sig);
  end loop;
end $$;

grant execute on function
  public.current_app_role(),
  public.is_super_admin(),
  public.has_permission(text),
  public.approve_manager(uuid),
  public.set_user_status(uuid, public.account_status, text),
  public.grant_manager_permission(uuid, text, text),
  public.revoke_manager_permission(uuid, text, text),
  public.log_manager_invited(uuid)
to authenticated;
grant execute on function public.bootstrap_super_admin(uuid) to service_role;
