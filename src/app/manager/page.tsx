import { Shell, PendingPhase } from '@/components/shell';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';

export default async function ManagerHome() {
  const { profile } = await requireRole('manager');
  const supabase = await createClient();
  const { data } = await supabase.from('manager_permissions').select('permission_key').eq('manager_id', profile.id).order('permission_key');
  const keys = (data ?? []).map((r) => r.permission_key as string);
  return (
    <Shell role="manager" name={profile.full_name} title="ম্যানেজার ড্যাশবোর্ড">
      <section className="mb-6">
        <h2 className="mb-2 font-semibold">আপনার অনুমোদিত পারমিশন</h2>
        {keys.length === 0 ? (
          <p className="text-sm text-ink/70">এখনো কোনো পারমিশন দেওয়া হয়নি। সুপার অ্যাডমিন পারমিশন দিলে এখানে দেখা যাবে।</p>
        ) : (
          <ul className="list-inside list-disc text-sm">{keys.map((k) => <li key={k}><code>{k}</code></li>)}</ul>
        )}
      </section>
      <PendingPhase items={[{ phase: 'ধাপ ৬', text: 'ইউজার সাপোর্ট, অভিযোগ এস্কেলেশন, রিপোর্ট' }]} />
    </Shell>
  );
}
