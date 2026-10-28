import { Shell, PendingPhase } from '@/components/shell';
import { requireRole } from '@/lib/auth/session';

export default async function BariAlaHome() {
  const { profile } = await requireRole('bari_ala');
  return (
    <Shell role="bari_ala" name={profile.full_name} title="বাড়িওয়ালা ড্যাশবোর্ড">
      <PendingPhase items={[
        { phase: 'ধাপ ২', text: 'বাড়ি, ফ্লোর ও ভাড়াযোগ্য ইউনিট' },
        { phase: 'ধাপ ৩', text: 'ভাড়াটিয়া আমন্ত্রণ / যোগদানের অনুরোধ' },
        { phase: 'ধাপ ৪', text: 'ভাড়ার চার্জ, পেমেন্ট নিশ্চিতকরণ ও বকেয়া' },
        { phase: 'ধাপ ৫', text: 'অভিযোগ ও রক্ষণাবেক্ষণ' },
      ]} />
    </Shell>
  );
}
