import type { ReactNode } from 'react';
import { ROLE_LABEL, type AppRole } from '@/lib/roles';

export function Shell({ role, name, title, children }: { role: AppRole; name: string | null; title: string; children: ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-ink/15 bg-paper">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3">
          <div>
            <p className="text-lg font-bold text-brand">আমার বাড়ি</p>
            <p className="text-sm text-ink/70">
              {ROLE_LABEL[role].bn} · {ROLE_LABEL[role].en}
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden sm:inline">{name ?? ''}</span>
            <form action="/auth/signout" method="post">
              <button className="btn-quiet" type="submit">
                লগ আউট
              </button>
            </form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}

export function PendingPhase({ items }: { items: { phase: string; text: string }[] }) {
  return (
    <section aria-label="আসন্ন ফিচার" className="rounded-lg border border-dashed border-ink/30 p-5">
      <p className="mb-3 font-semibold">এই অংশগুলো এখনো তৈরি হয়নি (পরবর্তী ধাপে আসছে)</p>
      <ul className="space-y-1 text-sm text-ink/80">
        {items.map((i) => (
          <li key={i.phase}>
            <span className="font-medium">{i.phase}:</span> {i.text}
          </li>
        ))}
      </ul>
    </section>
  );
}
