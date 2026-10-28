import { RoleGate } from '@/components/role-gate';
import { RoleHeader } from '@/components/role-header';
import { PendingPhase, Screen, Title } from '@/components/ui';

export default function VaratiyeHome() {
  return (
    <RoleGate allow={['varatiye']}>
      <Screen>
        <Title>ভাড়াটিয়া ড্যাশবোর্ড</Title>
        <RoleHeader />
        <PendingPhase items={[
          { phase: 'ধাপ ৩', text: 'বাড়িতে যোগদানের অনুরোধ ও অনুমোদিত ভাড়াচুক্তি' },
          { phase: 'ধাপ ৪', text: 'ভাড়া, বকেয়া ও পেমেন্ট ইতিহাস' },
          { phase: 'ধাপ ৫', text: 'অভিযোগ জমা ও অবস্থা দেখা' },
        ]} />
      </Screen>
    </RoleGate>
  );
}
