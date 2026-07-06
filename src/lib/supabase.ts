import { createClient } from '@supabase/supabase-js'

// Supabase project credentials come from environment variables (see .env.example).
// The anon key is safe to expose in the client; Row-Level Security is what enforces
// privacy — every table has RLS ON with `user_id = auth.uid()`.
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  // Not fatal during scaffolding — auth/tables get wired up in build step 2.
  console.warn(
    '[Ascend] Supabase env vars missing. Copy .env.example to .env.local and fill in ' +
      'VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from your Supabase project settings.',
  )
}

export const supabase = createClient(supabaseUrl ?? '', supabaseAnonKey ?? '', {
  auth: {
    // Persistent session: log in once per device, then never see the login screen again.
    persistSession: true,
    autoRefreshToken: true,
    storageKey: 'ascend-auth',
  },
})
