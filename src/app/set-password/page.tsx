import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { setPasswordAction } from './actions';

export default async function SetPasswordPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect('/login');
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-4 text-2xl font-bold text-brand">পাসওয়ার্ড সেট করুন</h1>
      {error && <p role="alert" className="mb-4 rounded border border-danger p-3 text-sm text-danger">পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।</p>}
      <form action={setPasswordAction} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">নতুন পাসওয়ার্ড</span>
          <input className="field" name="password" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <button className="btn w-full" type="submit">সংরক্ষণ করুন</button>
      </form>
    </main>
  );
}
