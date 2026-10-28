import type { ReactNode } from 'react';
import { Redirect } from 'expo-router';
import { useAuth } from '@/lib/auth';
import type { AppRole } from '@/lib/roles';

/**
 * UX guard only. The real enforcement is Supabase RLS + server-side functions: even if this
 * check were bypassed on a rooted device, the database would still refuse the data.
 */
export function RoleGate({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { profile } = useAuth();
  if (!profile || !allow.includes(profile.role)) return <Redirect href="/forbidden" />;
  return <>{children}</>;
}
