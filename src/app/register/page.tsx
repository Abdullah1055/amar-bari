import Link from 'next/link';
import { registerAction } from './actions';

const MESSAGES: Record<string, string> = {
  invalid: 'তথ্য সঠিক নয়। পাসওয়ার্ড কমপক্ষে ১০ অক্ষরের হতে হবে।',
  failed: 'নিবন্ধন করা যায়নি। পরে আবার চেষ্টা করুন।',
};

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1 text-2xl font-bold text-brand">নিবন্ধন</h1>
      <p className="mb-6 text-ink/70">আপনি কে হিসেবে যোগ দিচ্ছেন?</p>
      {error && <p role="alert" className="mb-4 rounded border border-danger p-3 text-sm text-danger">{MESSAGES[error] ?? MESSAGES.failed}</p>}
      <form action={registerAction} className="space-y-4">
        <fieldset className="space-y-2">
          <legend className="mb-1 text-sm font-medium">ভূমিকা</legend>
          <label className="flex items-center gap-2"><input type="radio" name="role" value="bari_ala" required /> বাড়িওয়ালা (Bari Ala)</label>
          <label className="flex items-center gap-2"><input type="radio" name="role" value="varatiye" required /> ভাড়াটিয়া (Varatiye)</label>
        </fieldset>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">পূর্ণ নাম</span>
          <input className="field" name="full_name" autoComplete="name" required maxLength={120} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">ইমেইল</span>
          <input className="field" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">পাসওয়ার্ড (কমপক্ষে ১০ অক্ষর)</span>
          <input className="field" name="password" type="password" autoComplete="new-password" minLength={10} required />
        </label>
        <button className="btn w-full" type="submit">নিবন্ধন করুন</button>
      </form>
      <p className="mt-6 text-sm">অ্যাকাউন্ট আছে? <Link className="underline" href="/login">লগইন</Link></p>
    </main>
  );
}
