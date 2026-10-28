import { redirect } from 'next/navigation';
import { requireActive, homeFor } from '@/lib/auth/session';

export default async function Dashboard() {
  const { profile } = await requireActive();
  redirect(homeFor(profile.role));
}
