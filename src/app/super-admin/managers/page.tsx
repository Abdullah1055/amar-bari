import Link from 'next/link';
import { Shell } from '@/components/shell';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { MANAGER_PERMISSION_KEYS } from '@/lib/roles';
import { InviteForm } from './invite-form';
import { approveManagerAction, savePermissionsAction } from './actions';

type ManagerRow = { id: string; full_name: string | null; status: 'pending' | 'active' | 'suspended' };

const STATUS_BN = { pending: 'অনুমোদনের অপেক্ষায়', active: 'সক্রিয়', suspended: 'স্থগিত' } as const;

export default async function ManagersPage() {
  const { profile } = await requireRole('super_admin');
  const supabase = await createClient();
  const [{ data: managers, error }, { data: perms }] = await Promise.all([
    supabase.from('profiles').select('id, full_name, status').eq('role', 'manager').order('created_at', { ascending: false }),
    supabase.from('manager_permissions').select('manager_id, permission_key'),
  ]);
  const byManager = new Map<string, Set<string>>();
  for (const p of perms ?? []) byManager.set(p.manager_id, (byManager.get(p.manager_id) ?? new Set()).add(p.permission_key));

  return (
    <Shell role="super_admin" name={profile.full_name} title="ম্যানেজার ও পারমিশন">
      <p className="mb-4 text-sm"><Link className="underline" href="/super-admin">← সুপার অ্যাডমিন</Link></p>
      <InviteForm />
      <section className="mt-8 space-y-4" aria-label="ম্যানেজার তালিকা">
        {error && <p role="alert" className="text-danger">তালিকা লোড করা যায়নি।</p>}
        {!error && (managers ?? []).length === 0 && <p className="text-ink/70">এখনো কোনো ম্যানেজার নেই।</p>}
        {((managers ?? []) as ManagerRow[]).map((m) => {
          const granted = byManager.get(m.id) ?? new Set<string>();
          return (
            <article key={m.id} className="rounded-lg border border-ink/20 bg-white p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">{m.full_name ?? 'নামহীন'} <span className="ml-2 text-sm font-normal text-ink/70">{STATUS_BN[m.status]}</span></p>
                {m.status === 'pending' && (
                  <form action={approveManagerAction}>
                    <input type="hidden" name="manager_id" value={m.id} />
                    <button className="btn" type="submit">অনুমোদন দিন</button>
                  </form>
                )}
              </div>
              <form action={savePermissionsAction} className="space-y-2">
                <input type="hidden" name="manager_id" value={m.id} />
                <fieldset className="grid gap-1 sm:grid-cols-2">
                  <legend className="mb-1 text-sm font-medium">পারমিশন</legend>
                  {MANAGER_PERMISSION_KEYS.map((k) => (
                    <label key={k} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" name="permissions" value={k} defaultChecked={granted.has(k)} /> <code>{k}</code>
                    </label>
                  ))}
                </fieldset>
                <button className="btn-quiet" type="submit">পারমিশন সংরক্ষণ</button>
              </form>
            </article>
          );
        })}
      </section>
    </Shell>
  );
}
