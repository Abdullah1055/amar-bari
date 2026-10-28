import 'server-only';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ROLE_HOME, type AppRole, type Profile } from '@/lib/roles';

export async function getSessionProfile() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser(); // verified with the auth server, not just the cookie
  if (!data.user) return null;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, role, status, full_name, preferred_language')
    .eq('id', data.user.id)
    .maybeSingle();
  if (!profile) return null;
  return { user: data.user, profile: profile as Profile };
}

/** Signed-in, active account required. */
export async function requireActive() {
  const session = await getSessionProfile();
  if (!session) redirect('/login');
  if (session.profile.status === 'pending') redirect('/pending');
  if (session.profile.status === 'suspended') redirect('/suspended');
  return session;
}

/** Signed-in, active, and one of the allowed roles. Call at the top of every protected page and action. */
export async function requireRole(...allowed: AppRole[]) {
  const session = await requireActive();
  if (!allowed.includes(session.profile.role)) redirect('/forbidden');
  return session;
}

export const homeFor = (role: AppRole) => ROLE_HOME[role];
