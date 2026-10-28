'use server';

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { registerSchema } from '@/lib/validation/auth';

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) redirect('/register?error=invalid');
  const { email, password, role, full_name } = parsed.data;
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { role, full_name }, // user_metadata is client-controlled; the DB trigger only honours bari_ala / varatiye
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?next=/dashboard`,
    },
  });
  if (error) redirect('/register?error=failed');
  redirect(data.session ? '/dashboard' : '/login?notice=check-email');
}
