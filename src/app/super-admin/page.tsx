import Link from 'next/link';
import { Shell, PendingPhase } from '@/components/shell';
import { requireRole } from '@/lib/auth/session';

export default async function SuperAdminHome() {
  const { profile } = await requireRole('super_admin');
  return (
    <Shell role="super_admin" name={profile.full_name} title="সুপার অ্যাডমিন">
      <p className="mb-6">
        <Link className="btn" href="/super-admin/managers">ম্যানেজার ও পারমিশন</Link>
      </p>
      <PendingPhase items={[
        { phase: 'ধাপ ৬', text: 'প্যাকেজ/সাবস্ক্রিপশন ব্যবস্থাপনা, রিপোর্ট, অডিট লগ দেখা' },
        { phase: 'ধাপ ৭', text: 'নিরাপত্তা পর্যবেক্ষণ' },
      ]} />
    </Shell>
  );
}
