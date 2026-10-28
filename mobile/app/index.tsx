import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/roles';
import { Loading } from '@/components/ui';

export default function Index() {
  const { loading, session, profile } = useAuth();
  if (loading) return <Loading />;
  if (!session) return <Redirect href="/login" />;
  if (!profile) return <Redirect href="/forbidden" />;
  return <Redirect href={ROLE_HOME[profile.role]} />;
}
