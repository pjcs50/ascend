import { create } from 'zustand'
import * as api from './api'
import type { CreedEntry, CreedInput } from './types'

interface CreedState {
  entries: CreedEntry[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  saveNorthStar: (text: string) => Promise<void>
  addValue: () => Promise<void>
  addLesson: () => Promise<void>
  update: (id: string, patch: CreedInput) => Promise<void>
  remove: (id: string) => Promise<void>
}

export const useCreedStore = create<CreedState>((set, get) => ({
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

  // North Star is a singleton: update the existing row or create the first one.
  saveNorthStar: async (text) => {
    const existing = get().entries.find((e) => e.kind === 'north_star')
    if (existing) {
      const updated = await api.updateEntry(existing.id, { body: text })
      set((s) => ({ entries: s.entries.map((e) => (e.id === existing.id ? updated : e)) }))
      return
    }
    try {
      const row = await api.createEntry('north_star', { body: text })
      set((s) => ({ entries: [...s.entries, row] }))
    } catch (e) {
      // Lost a create race (partial unique index) — reload and update the winner.
      const entries = await api.fetchEntries()
      const winner = entries.find((x) => x.kind === 'north_star')
      if (winner) {
        const updated = await api.updateEntry(winner.id, { body: text })
        set({ entries: entries.map((x) => (x.id === winner.id ? updated : x)) })
      } else {
        throw e
      }
    }
  },

  addValue: async () => {
    const row = await api.createEntry('value', { title: '', body: '' })
    set((s) => ({ entries: [...s.entries, row] }))
  },

  addLesson: async () => {
    const today = new Date().toISOString().slice(0, 10)
    const row = await api.createEntry('lesson', { title: '', incident: '', entry_date: today })
    set((s) => ({ entries: [...s.entries, row] }))
  },

  update: async (id, patch) => {
    const updated = await api.updateEntry(id, patch)
    set((s) => ({ entries: s.entries.map((e) => (e.id === id ? updated : e)) }))
  },

  remove: async (id) => {
    await api.deleteEntry(id)
    set((s) => ({ entries: s.entries.filter((e) => e.id !== id) }))
  },
}))
