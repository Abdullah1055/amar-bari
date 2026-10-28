import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { Loading, colors } from '@/components/ui';

export default function AuthLayout() {
  const { loading, session } = useAuth();
  if (loading) return <Loading />;
  if (session) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerTitle: 'আমার বাড়ি', headerStyle: { backgroundColor: colors.paper }, headerTintColor: colors.brand }} />;
}
