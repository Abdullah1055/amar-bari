'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { setPasswordSchema } from '@/lib/validation/auth';

export async function setPasswordAction(formData: FormData) {
  const parsed = setPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/set-password?error=weak');
  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) redirect('/set-password?error=weak');
  redirect('/dashboard');
}
