import { create } from 'zustand'
import * as api from './api'
import type { KbPage, KbPagePatch } from './types'

interface KbState {
  pages: KbPage[]
  selectedId: string | null
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  select: (id: string | null) => void
  addPage: (parentId: string | null) => Promise<void>
  updatePage: (id: string, patch: KbPagePatch) => Promise<void>
  removePage: (id: string) => Promise<void>
}

export const useKbStore = create<KbState>((set, get) => ({
  pages: [],
  selectedId: null,
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const pages = await api.fetchPages()
      set({ pages, loading: false, loaded: true })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  select: (id) => set({ selectedId: id }),

  addPage: async (parentId) => {
    const page = await api.createPage(parentId)
    set((s) => ({ pages: [...s.pages, page], selectedId: page.id }))
  },

  updatePage: async (id, patch) => {
    const updated = await api.updatePage(id, patch)
    set((s) => ({ pages: s.pages.map((p) => (p.id === id ? updated : p)) }))
  },

  removePage: async (id) => {
    await api.deletePage(id)
    // Drop the page and any descendants from local state.
    const pages = get().pages
    const toRemove = new Set<string>([id])
    let changed = true
    while (changed) {
      changed = false
      for (const p of pages) {
        if (p.parent_id && toRemove.has(p.parent_id) && !toRemove.has(p.id)) {
          toRemove.add(p.id)
          changed = true
        }
      }
    }
    set((s) => ({
      pages: s.pages.filter((p) => !toRemove.has(p.id)),
      selectedId: toRemove.has(s.selectedId ?? '') ? null : s.selectedId,
    }))
  },
}))
