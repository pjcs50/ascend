import { create } from 'zustand'
import * as api from './api'
import type { ForgeItem, ForgePrompt, ForgeStatus, TriageResult } from './types'

interface ForgeState {
  items: ForgeItem[]
  prompts: ForgePrompt[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  capture: (rawText: string) => Promise<void>
  applyTriage: (itemId: string, triage: TriageResult) => Promise<void>
  setStatus: (itemId: string, status: ForgeStatus) => Promise<void>
  remove: (itemId: string) => Promise<void>
}

export const useForgeStore = create<ForgeState>((set) => ({
  items: [],
  prompts: [],
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const [items, prompts] = await Promise.all([api.fetchItems(), api.fetchPrompts()])
      set({ items, prompts, loading: false, loaded: true })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  capture: async (rawText) => {
    const item = await api.createItem(rawText)
    set((s) => ({ items: [item, ...s.items] }))
  },

  applyTriage: async (itemId, triage) => {
    const { item, prompts } = await api.applyTriage(itemId, triage)
    set((s) => ({
      items: s.items.map((i) => (i.id === itemId ? item : i)),
      prompts: [...s.prompts.filter((p) => p.forge_item_id !== itemId), ...prompts],
    }))
  },

  setStatus: async (itemId, status) => {
    const item = await api.setStatus(itemId, status)
    set((s) => ({ items: s.items.map((i) => (i.id === itemId ? item : i)) }))
  },

  remove: async (itemId) => {
    await api.deleteItem(itemId)
    set((s) => ({
      items: s.items.filter((i) => i.id !== itemId),
      prompts: s.prompts.filter((p) => p.forge_item_id !== itemId),
    }))
  },
}))
