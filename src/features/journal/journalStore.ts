import { create } from 'zustand'
import * as api from './api'
import type { JournalEntry, JournalFields } from './api'

// Single source of truth for ALL journal entries (including today). Both the
// Command Center (content + intention) and the Journal page (content, mood,
// energy, tags) write through `update`, which does a partial-PATCH-by-id — so
// no two surfaces can ever clobber each other's fields on the shared day-row.
interface JournalState {
  entries: JournalEntry[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  update: (date: string, patch: JournalFields) => Promise<void>
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const entries = await api.fetchEntries()
      set({ entries, loading: false, loaded: true })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  update: async (date, patch) => {
    const existing = get().entries.find((e) => e.entry_date === date)
    if (existing) {
      const updated = await api.updateEntry(existing.id, patch)
      set((s) => ({ entries: s.entries.map((e) => (e.id === existing.id ? updated : e)) }))
    } else {
      const created = await api.createEntry(date, patch)
      set((s) => ({ entries: [created, ...s.entries] }))
    }
  },
}))
