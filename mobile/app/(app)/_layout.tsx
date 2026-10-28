import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Body, Button, Loading, Screen, Title, colors } from '@/components/ui';

function Status({ text }: { text: string }) {
  const { signOut } = useAuth();
  return (
    <Screen>
      <Title>আমার বাড়ি</Title>
      <Body>{text}</Body>
      <Button quiet title="লগ আউট" onPress={signOut} />
    </Screen>
  );
}

export default function AppLayout() {
  const { loading, session, profile } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Redirect href="/login" />;
  if (!profile) return <Status text="প্রোফাইল পাওয়া যায়নি। আবার লগইন করুন।" />;
  if (profile.status === 'pending') return <Status text="আপনার অ্যাকাউন্ট অনুমোদনের অপেক্ষায় আছে। সুপার অ্যাডমিন অনুমোদন দিলে আপনি প্রবেশ করতে পারবেন।" />;
  if (profile.status === 'suspended') return <Status text="আপনার অ্যাকাউন্ট স্থগিত করা হয়েছে। সহায়তার জন্য প্ল্যাটফর্ম কর্তৃপক্ষের সাথে যোগাযোগ করুন।" />;
  return <Stack screenOptions={{ headerTitle: 'আমার বাড়ি', headerStyle: { backgroundColor: colors.paper }, headerTintColor: colors.brand }} />;
}
