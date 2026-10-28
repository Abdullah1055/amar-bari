'use client';

import { useActionState } from 'react';
import { inviteManagerAction, type InviteState } from './actions';

export function InviteForm() {
  const [state, action, pending] = useActionState<InviteState | null, FormData>(inviteManagerAction, null);
  return (
    <form action={action} className="space-y-3 rounded-lg border border-ink/20 bg-white p-4">
      <h2 className="font-semibold">নতুন ম্যানেজার যোগ করুন</h2>
      <label className="block">
        <span className="mb-1 block text-sm">পূর্ণ নাম</span>
        <input className="field" name="full_name" required maxLength={120} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm">ইমেইল</span>
        <input className="field" name="email" type="email" required />
      </label>
      <button className="btn" type="submit" disabled={pending}>{pending ? 'অপেক্ষা করুন…' : 'ম্যানেজার তৈরি করুন'}</button>
      {state && (
        <div role={state.ok ? 'status' : 'alert'} className={`text-sm ${state.ok ? 'text-brand' : 'text-danger'}`}>
          <p>{state.message}</p>
          {state.setupLink && <textarea readOnly className="field mt-2 text-xs" rows={3} value={state.setupLink} onFocus={(e) => e.currentTarget.select()} />}
        </div>
      )}
    </form>
  );
}
