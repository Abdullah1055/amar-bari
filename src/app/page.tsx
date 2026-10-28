import { redirect } from 'next/navigation';
import { getSessionProfile, homeFor } from '@/lib/auth/session';

export default async function Home() {
  const session = await getSessionProfile();
  redirect(session ? homeFor(session.profile.role) : '/login');
}
