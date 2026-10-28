import { useEffect, useState } from 'react';
import { Text } from 'react-native';
import { RoleGate } from '@/components/role-gate';
import { RoleHeader } from '@/components/role-header';
import { Body, Notice, PendingPhase, Screen, Title } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

function Permissions() {
  const { profile } = useAuth();
  const [keys, setKeys] = useState<string[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase.from('manager_permissions').select('permission_key').eq('manager_id', profile.id).order('permission_key').then(({ data, error }) => {
      if (error) setFailed(true);
      else setKeys((data ?? []).map((r) => r.permission_key as string));
    });
  }, [profile]);

  if (failed) return <Notice kind="error">পারমিশন লোড করা যায়নি।</Notice>;
  if (keys === null) return <Body muted>লোড হচ্ছে…</Body>;
  if (keys.length === 0) return <Body muted>এখনো কোনো পারমিশন দেওয়া হয়নি। সুপার অ্যাডমিন পারমিশন দিলে এখানে দেখা যাবে।</Body>;
  return <>{keys.map((k) => <Text key={k} style={{ fontSize: 15, fontFamily: 'monospace' }}>• {k}</Text>)}</>;
}

export default function ManagerHome() {
  return (
    <RoleGate allow={['manager']}>
      <Screen>
        <Title>ম্যানেজার ড্যাশবোর্ড</Title>
        <RoleHeader />
        <Body>আপনার অনুমোদিত পারমিশন</Body>
        <Permissions />
        <PendingPhase items={[{ phase: 'ধাপ ৬', text: 'ইউজার সাপোর্ট, অভিযোগ এস্কেলেশন, রিপোর্ট' }]} />
      </Screen>
    </RoleGate>
  );
}
