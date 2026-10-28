import { useAuth } from '@/lib/auth';
import { Body, Button, Screen, Title } from '@/components/ui';

export default function Forbidden() {
  const { signOut } = useAuth();
  return (
    <Screen>
      <Title>অনুমতি নেই</Title>
      <Body>এই পাতা দেখার অনুমতি আপনার নেই।</Body>
      <Button quiet title="লগ আউট" onPress={signOut} />
    </Screen>
  );
}
