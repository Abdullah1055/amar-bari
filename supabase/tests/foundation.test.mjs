// RLS / authorization tests. Runs the real migration on PGlite (Postgres in WASM)
// with a minimal stub of Supabase's auth schema and roles.
import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { PGlite } from '@electric-sql/pglite';

const db = new PGlite();
const ids = {};

const shim = `
create role anon nologin; create role authenticated nologin; create role service_role nologin;
create schema auth;
create table auth.users (id uuid primary key default gen_random_uuid(), email text,
  raw_app_meta_data jsonb not null default '{}', raw_user_meta_data jsonb not null default '{}');
create function auth.uid() returns uuid language sql stable
  as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
grant usage on schema auth to anon, authenticated, service_role;
grant execute on function auth.uid() to anon, authenticated, service_role;
grant usage on schema public to anon, authenticated, service_role;
`;

async function signup(email, userMeta = {}, appMeta = {}) {
  const r = await db.query(
    `insert into auth.users (email, raw_user_meta_data, raw_app_meta_data) values ($1,$2,$3) returning id`,
    [email, JSON.stringify(userMeta), JSON.stringify(appMeta)]);
  return r.rows[0].id;
}
async function as(role, uid, fn) {
  await db.exec(`set role ${role}`);
  await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [uid ?? '']);
  try { return await fn(); } finally { await db.exec('reset role'); }
}
const denied = (p) => assert.rejects(p, (e) => /permission denied|forbidden|42501|row-level|immutable|managed by trusted|append-only/i.test(String(e.message) + (e.code ?? '')));

before(async () => {
  await db.exec(shim);
  for (const f of readdirSync('supabase/migrations').sort()) await db.exec(readFileSync(`supabase/migrations/${f}`, 'utf8'));
  ids.landA = await signup('landa@test.local', { role: 'bari_ala', full_name: 'Landlord A' });
  ids.landB = await signup('landb@test.local', { role: 'bari_ala', full_name: 'Landlord B' });
  ids.tenA = await signup('tena@test.local', { role: 'varatiye', full_name: 'Tenant A' });
  ids.tenB = await signup('tenb@test.local', { role: 'varatiye', full_name: 'Tenant B' });
  ids.mgr = await signup('mgr@test.local', { full_name: 'Manager' }, { provisioned_role: 'manager' });
  ids.founder = await signup('founder@test.local', { role: 'varatiye', full_name: 'Founder' });
  await as('service_role', null, () => db.query('select public.bootstrap_super_admin($1)', [ids.founder]));
});

const selectIds = async () => (await db.query('select id from public.profiles')).rows.map((r) => r.id);

test('signup: only bari_ala / varatiye can be self-selected', async () => {
  for (const role of ['super_admin', 'manager', 'owner', 'caretaker', undefined]) {
    await assert.rejects(signup(`x-${role}@test.local`, role ? { role } : {}), /invalid_signup_role/);
  }
});

test('signup: app_metadata may only provision a pending manager', async () => {
  await assert.rejects(signup('bad@test.local', {}, { provisioned_role: 'super_admin' }), /invalid_provisioned_role/);
  const r = await db.query('select role, status from public.profiles where id=$1', [ids.mgr]);
  assert.deepEqual(r.rows[0], { role: 'manager', status: 'pending' });
});

test('exactly four roles exist in the enum', async () => {
  const r = await db.query(`select enumlabel from pg_enum e join pg_type t on t.oid=e.enumtypid where t.typname='app_role' order by enumsortorder`);
  assert.deepEqual(r.rows.map((x) => x.enumlabel), ['super_admin', 'manager', 'bari_ala', 'varatiye']);
});

test('anonymous users read nothing', async () => {
  await denied(as('anon', null, () => db.query('select * from public.profiles')));
});

test('users see only their own profile (cross-landlord / cross-tenant isolation)', async () => {
  assert.deepEqual(await as('authenticated', ids.landA, selectIds), [ids.landA]);
  assert.deepEqual(await as('authenticated', ids.tenA, selectIds), [ids.tenA]);
  assert.deepEqual(await as('authenticated', ids.tenB, selectIds), [ids.tenB]);
});

test('users cannot self-elevate role or status, or edit others', async () => {
  await denied(as('authenticated', ids.landA, () => db.query(`update public.profiles set role='super_admin' where id=$1`, [ids.landA])));
  await denied(as('authenticated', ids.tenA, () => db.query(`update public.profiles set role='manager' where id=$1`, [ids.tenA])));
  await denied(as('authenticated', ids.landA, () => db.query(`update public.profiles set status='active' where id=$1`, [ids.landA])));
  const r = await as('authenticated', ids.landA, () => db.query(`update public.profiles set full_name='Other' where id=$1`, [ids.landB]));
  assert.equal(r.affectedRows, 0);
  const ok = await as('authenticated', ids.landA, () => db.query(`update public.profiles set full_name='Renamed', phone='+8801700000000' where id=$1`, [ids.landA]));
  assert.equal(ok.affectedRows, 1);
});

test('users cannot insert or delete profiles, or touch audit/permission tables', async () => {
  await denied(as('authenticated', ids.landA, () => db.query(`insert into public.profiles (id, role) values (gen_random_uuid(),'super_admin')`)));
  await denied(as('authenticated', ids.landA, () => db.query(`delete from public.profiles where id=$1`, [ids.landA])));
  await denied(as('authenticated', ids.landA, () => db.query(`insert into public.audit_logs (action, resource_type) values ('x','y')`)));
  await denied(as('authenticated', ids.landA, () => db.query(`insert into public.manager_permissions values ($1,'users.view',$1,now())`, [ids.landA])));
});

test('non-super-admins cannot call admin functions', async () => {
  for (const uid of [ids.landA, ids.tenA, ids.mgr]) {
    await denied(as('authenticated', uid, () => db.query('select public.approve_manager($1)', [ids.mgr])));
    await denied(as('authenticated', uid, () => db.query(`select public.grant_manager_permission($1,'users.view')`, [ids.mgr])));
    await denied(as('authenticated', uid, () => db.query(`select public.set_user_status($1,'suspended','x')`, [ids.tenB])));
    await denied(as('authenticated', uid, () => db.query('select public.log_manager_invited($1)', [ids.mgr])));
  }
});

test('bootstrap_super_admin is not callable by authenticated users', async () => {
  await denied(as('authenticated', ids.landA, () => db.query('select public.bootstrap_super_admin($1)', [ids.landA])));
  await denied(as('anon', null, () => db.query('select public.bootstrap_super_admin($1)', [ids.landA])));
  await denied(as('authenticated', ids.landA, () => db.query(`select public.audit_write($1,'fake','x','x',null)`, [ids.landA])));
  const r = await db.query('select role from public.profiles where id=$1', [ids.landA]);
  assert.equal(r.rows[0].role, 'bari_ala');
});

test('pending manager has no access even after permission rows exist', async () => {
  await as('authenticated', ids.founder, () => db.query('select public.log_manager_invited($1)', [ids.mgr]));
  await as('authenticated', ids.founder, () => db.query(`select public.grant_manager_permission($1,'users.view','test')`, [ids.mgr]));
  assert.deepEqual(await as('authenticated', ids.mgr, selectIds), [ids.mgr]);
});

test('approved manager is limited to granted permissions and non-admin profiles', async () => {
  await as('authenticated', ids.founder, () => db.query('select public.approve_manager($1)', [ids.mgr]));
  const seen = await as('authenticated', ids.mgr, selectIds);
  assert.ok(seen.includes(ids.landA) && seen.includes(ids.tenA) && seen.includes(ids.mgr));
  assert.ok(!seen.includes(ids.founder), 'manager must not see super admin');
  await as('authenticated', ids.founder, () => db.query(`select public.revoke_manager_permission($1,'users.view','test')`, [ids.mgr]));
  assert.deepEqual(await as('authenticated', ids.mgr, selectIds), [ids.mgr]);
  await denied(as('authenticated', ids.mgr, () => db.query('select * from public.audit_logs').then((r) => { if (!r.rows.length) throw new Error('forbidden'); })));
});

test('super admin sees all, can suspend users (reason required), not other super admins', async () => {
  assert.equal((await as('authenticated', ids.founder, selectIds)).length, 6);
  await assert.rejects(as('authenticated', ids.founder, () => db.query(`select public.set_user_status($1,'suspended','')`, [ids.tenB])), /reason_required/);
  await as('authenticated', ids.founder, () => db.query(`select public.set_user_status($1,'suspended','policy test')`, [ids.tenB]));
  assert.deepEqual(await as('authenticated', ids.tenB, async () => (await db.query('select status from public.profiles')).rows[0]), { status: 'suspended' });
  await assert.rejects(as('authenticated', ids.founder, () => db.query(`select public.set_user_status($1,'suspended','x')`, [ids.founder])), /cannot_change_super_admin/);
});

test('suspended user loses role-based access', async () => {
  const r = await as('authenticated', ids.tenB, async () => (await db.query('select public.current_app_role() as r')).rows[0].r);
  assert.equal(r, null);
});

test('audit log: super admin only, append-only, records privileged actions', async () => {
  const rows = await as('authenticated', ids.founder, async () => (await db.query('select action, actor_id, reason from public.audit_logs')).rows);
  const actions = rows.map((r) => r.action);
  for (const a of ['profile.created', 'manager.invited', 'super_admin.bootstrapped', 'manager.approved', 'manager.permission_granted', 'manager.permission_revoked', 'user.status_changed'])
    assert.ok(actions.includes(a), `missing audit action ${a}`);
  assert.equal((await as('authenticated', ids.landA, async () => (await db.query('select * from public.audit_logs')).rows)).length, 0);
  await denied(as('authenticated', ids.founder, () => db.query(`update public.audit_logs set action='x'`)));
  await assert.rejects(db.query('delete from public.audit_logs'), /append-only/);
});
