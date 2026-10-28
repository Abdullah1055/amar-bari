import 'server-only';
import { createClient } from '@supabase/supabase-js';

/**
 * Service-role client. BYPASSES RLS. Server-only; use exclusively after an explicit
 * Super Admin check, and never pass its results through unfiltered.
 */
export function createAdminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
