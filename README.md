# আমার বাড়ি (Amar Bari) — Phase 1 foundation

Next.js 16 (App Router) · React 19 · TypeScript strict · Tailwind v4 · Supabase (Postgres, Auth).

## Scope of this pack
Four-role identity model and secure auth only. Exactly four core roles: `super_admin`, `manager`, `bari_ala`, `varatiye`.
Properties, tenancy, rent ledger, complaints and subscriptions are **not built yet** (Phases 2–6); role home pages say so explicitly.

## Security model
- Public signup can choose only `bari_ala` or `varatiye`. A DB trigger rejects every other value (UI validation is not relied on).
- Managers are created only by a Super Admin via the server-side admin API (`app_metadata.provisioned_role`, which end users cannot set). They start `pending` and need explicit approval.
- Super Admin is never created through the app. Founder bootstrap: sign up normally, then run once in the SQL editor / a server script with the service role: `select public.bootstrap_super_admin('<user uuid>');`
- `profiles.role` / `status` are not updatable by end users (column grants + trigger). Changes go through audited `SECURITY DEFINER` functions only.
- Manager access = explicit rows in `manager_permissions`; none by default. Pending/suspended accounts get no role-based access.
- `audit_logs` is append-only and readable by Super Admin only.
- Every protected page/action calls `requireRole(...)` server-side; the proxy only refreshes sessions and redirects signed-out visitors.
- Service-role key is used only in `src/lib/supabase/admin.ts` (`server-only`).

## Setup
```bash
cp .env.example .env.local        # fill in values; never commit
npm install
# apply supabase/migrations/*.sql with the Supabase CLI:  supabase db push
npm run dev
```
Supabase dashboard: enable Email auth; set Site URL and redirect URL to `NEXT_PUBLIC_SITE_URL`; Auth → disable "Allow new users to sign up" is NOT required (the trigger guards roles).

## Checks
```bash
npm run test:db     # applies the real migration on PGlite and runs RLS / privilege-escalation tests
npm run typecheck && npm run lint && npm run build
```

## Known limitations
- Tests run on PGlite with a stub of Supabase's `auth` schema/roles, not on a live Supabase project. Re-run against a local `supabase start` stack before production.
- Manager setup links are shown once to the Super Admin (no SMTP/email delivery wired yet).
- No generated DB types yet (`supabase gen types`), no rate limiting, no e2e browser tests, OAuth signup unsupported (role required at signup).
- Convention: every migration adding a function must revoke PUBLIC/anon/authenticated execute and grant narrowly (see end of the first migration).
