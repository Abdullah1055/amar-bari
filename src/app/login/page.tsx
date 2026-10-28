import Link from 'next/link';
import { loginAction } from './actions';

const MESSAGES: Record<string, string> = {
  invalid: 'ইমেইল বা পাসওয়ার্ড সঠিক নয়।',
  'check-email': 'নিবন্ধন সম্পন্ন। ইমেইল যাচাই করে লগইন করুন।',
  'link-expired': 'লিংকটি মেয়াদোত্তীর্ণ বা অবৈধ।',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; notice?: string }> }) {
  const { error, notice } = await searchParams;
  const message = MESSAGES[error ?? notice ?? ''];
  return (
    <main className="mx-auto max-w-sm px-4 py-16">
      <h1 className="mb-1 text-2xl font-bold text-brand">আমার বাড়ি</h1>
      <p className="mb-6 text-ink/70">লগইন করুন</p>
      {message && (
        <p role={error ? 'alert' : 'status'} className={`mb-4 rounded border p-3 text-sm ${error ? 'border-danger text-danger' : 'border-brand text-brand'}`}>
          {message}
        </p>
      )}
      <form action={loginAction} className="space-y-4">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">ইমেইল</span>
          <input className="field" name="email" type="email" autoComplete="email" required />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">পাসওয়ার্ড</span>
          <input className="field" name="password" type="password" autoComplete="current-password" required />
        </label>
        <button className="btn w-full" type="submit">লগইন</button>
      </form>
      <p className="mt-6 text-sm">
        নতুন? <Link className="underline" href="/register">নিবন্ধন করুন</Link>
      </p>
    </main>
  );
}
