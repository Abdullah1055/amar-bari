'use server';

import { revalidatePath } from 'next/cache';
import { requireRole } from '@/lib/auth/session';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { inviteManagerSchema } from '@/lib/validation/auth';
import { MANAGER_PERMISSION_KEYS } from '@/lib/roles';

export type InviteState = { ok: boolean; message: string; setupLink?: string };

export async function inviteManagerAction(_prev: InviteState | null, formData: FormData): Promise<InviteState> {
  await requireRole('super_admin');
  const parsed = inviteManagerSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, message: 'নাম ও সঠিক ইমেইল দিন।' };
  const { email, full_name } = parsed.data;

  const admin = createAdminClient();
  // app_metadata cannot be set by end users; the DB trigger turns this into a *pending* manager.
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: true,
    user_metadata: { full_name },
    app_metadata: { provisioned_role: 'manager' },
  });
  if (created.error || !created.data.user) return { ok: false, message: 'ম্যানেজার তৈরি করা যায়নি (ইমেইল আগে ব্যবহৃত হতে পারে)।' };

  const supabase = await createClient();
  await supabase.rpc('log_manager_invited', { p_manager_id: created.data.user.id });

  const link = await admin.auth.admin.generateLink({ type: 'recovery', email });
  revalidatePath('/super-admin/managers');
  if (link.error || !link.data.properties?.hashed_token) {
    return { ok: true, message: 'ম্যানেজার তৈরি হয়েছে, কিন্তু সেটআপ লিংক তৈরি করা যায়নি।' };
  }
  // SMTP/email delivery is not wired yet: the one-time link is shown once to the Super Admin and never stored or logged.
  const setupLink = `${process.env.NEXT_PUBLIC_SITE_URL}/auth/confirm?token_hash=${link.data.properties.hashed_token}&type=recovery&next=/set-password`;
  return { ok: true, message: 'ম্যানেজার তৈরি হয়েছে (অনুমোদন বাকি)। নিচের এককালীন লিংকটি নিরাপদে তাকে পাঠান।', setupLink };
}

export async function approveManagerAction(formData: FormData) {
  await requireRole('super_admin');
  const id = String(formData.get('manager_id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const supabase = await createClient();
  await supabase.rpc('approve_manager', { p_manager_id: id });
  revalidatePath('/super-admin/managers');
}

export async function savePermissionsAction(formData: FormData) {
  await requireRole('super_admin');
  const id = String(formData.get('manager_id') ?? '');
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  const wanted = new Set(formData.getAll('permissions').map(String).filter((k) => (MANAGER_PERMISSION_KEYS as readonly string[]).includes(k)));

  const supabase = await createClient();
  const { data } = await supabase.from('manager_permissions').select('permission_key').eq('manager_id', id);
  const current = new Set((data ?? []).map((r) => r.permission_key as string));
  for (const key of wanted) if (!current.has(key)) await supabase.rpc('grant_manager_permission', { p_manager_id: id, p_key: key, p_reason: null });
  for (const key of current) if (!wanted.has(key)) await supabase.rpc('revoke_manager_permission', { p_manager_id: id, p_key: key, p_reason: null });
  revalidatePath('/super-admin/managers');
}
