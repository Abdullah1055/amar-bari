import { router } from 'expo-router';
import { RoleGate } from '@/components/role-gate';
import { RoleHeader } from '@/components/role-header';
import { Button, PendingPhase, Screen, Title } from '@/components/ui';

export default function SuperAdminHome() {
  return (
    <RoleGate allow={['super_admin']}>
      <Screen>
        <Title>সুপার অ্যাডমিন</Title>
        <RoleHeader />
        <Button title="ম্যানেজার ও পারমিশন" onPress={() => router.push('/super-admin/managers')} />
        <PendingPhase items={[
          { phase: 'ধাপ ৬', text: 'প্যাকেজ/সাবস্ক্রিপশন, রিপোর্ট, অডিট লগ দেখা' },
          { phase: 'ধাপ ৭', text: 'নিরাপত্তা পর্যবেক্ষণ' },
        ]} />
      </Screen>
    </RoleGate>
  );
}
