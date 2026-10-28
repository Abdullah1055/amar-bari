import { Shell, PendingPhase } from '@/components/shell';
import { requireRole } from '@/lib/auth/session';

export default async function VaratiyeHome() {
  const { profile } = await requireRole('varatiye');
  return (
    <Shell role="varatiye" name={profile.full_name} title="ভাড়াটিয়া ড্যাশবোর্ড">
      <PendingPhase items={[
        { phase: 'ধাপ ৩', text: 'বাড়িতে যোগদানের অনুরোধ ও অনুমোদিত ভাড়াচুক্তি' },
        { phase: 'ধাপ ৪', text: 'ভাড়া, বকেয়া ও পেমেন্ট ইতিহাস' },
        { phase: 'ধাপ ৫', text: 'অভিযোগ জমা ও অবস্থা দেখা' },
      ]} />
    </Shell>
  );
}
