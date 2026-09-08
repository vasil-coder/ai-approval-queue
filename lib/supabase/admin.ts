import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role client. Bypasses Row Level Security.
 *
 * Only import this from Route Handlers or Server Actions, never from a
 * component that ships to the browser. The webhook needs it because inbound
 * events arrive unauthenticated and RLS grants no insert to anon.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  )
}
