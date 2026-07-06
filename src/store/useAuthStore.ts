import { create } from 'zustand'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

// Single-user auth. Login-only: the one account is created from the Supabase
// dashboard (Authentication → Users → Add user), so there is no signup flow.
// The session persists (see lib/supabase.ts), so login happens once per device.
interface AuthState {
  session: Session | null
  loading: boolean
  setSession: (session: Session | null) => void
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  loading: true,
  setSession: (session) => set({ session, loading: false }),
  signIn: async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    return { error: error?.message ?? null }
  },
  signOut: async () => {
    await supabase.auth.signOut()
  },
}))
