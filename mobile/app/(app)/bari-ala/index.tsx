import { RoleGate } from '@/components/role-gate';
import { RoleHeader } from '@/components/role-header';
import { PendingPhase, Screen, Title } from '@/components/ui';

export default function BariAlaHome() {
  return (
    <RoleGate allow={['bari_ala']}>
      <Screen>
        <Title>বাড়িওয়ালা ড্যাশবোর্ড</Title>
        <RoleHeader />
        <PendingPhase items={[
          { phase: 'ধাপ ২', text: 'বাড়ি, ফ্লোর ও ভাড়াযোগ্য ইউনিট' },
          { phase: 'ধাপ ৩', text: 'ভাড়াটিয়া আমন্ত্রণ / যোগদানের অনুরোধ' },
          { phase: 'ধাপ ৪', text: 'ভাড়ার চার্জ, পেমেন্ট নিশ্চিতকরণ ও বকেয়া' },
          { phase: 'ধাপ ৫', text: 'অভিযোগ ও রক্ষণাবেক্ষণ' },
        ]} />
      </Screen>
    </RoleGate>
  );
}
