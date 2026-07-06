import { create } from 'zustand'
import { supabase } from '../../lib/supabase'
import type { FocusSession } from './types'

interface FocusState {
  sessions: FocusSession[]
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  log: (minutes: number, label: string | null) => Promise<void>
}

export const useFocusStore = create<FocusState>((set) => ({
  sessions: [],
  loaded: false,
  error: null,

  load: async () => {
    const { data, error } = await supabase
      .from('focus_sessions')
      .select('*')
      .order('started_at', { ascending: false })
    if (error) {
      set({ error: error.message })
      return
    }
    set({ sessions: data as FocusSession[], loaded: true })
  },

  log: async (minutes, label) => {
    const { data, error } = await supabase
      .from('focus_sessions')
      .insert({ minutes, label })
      .select()
      .single()
    if (error) {
      set({ error: error.message })
      return
    }
    set((s) => ({ sessions: [data as FocusSession, ...s.sessions] }))
  },
}))
