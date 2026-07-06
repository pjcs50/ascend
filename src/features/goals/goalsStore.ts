import { create } from 'zustand'
import * as api from './api'
import type { Goal, GoalLevel, LifeArea, LifeAreaRating } from './types'

interface GoalsState {
  goals: Goal[]
  lifeAreas: LifeArea[]
  ratings: LifeAreaRating[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  addGoal: (level: GoalLevel, title: string, parentId: string | null) => Promise<void>
  updateGoal: (id: string, patch: Partial<Pick<Goal, 'title' | 'notes' | 'done' | 'parent_id'>>) => Promise<void>
  removeGoal: (id: string) => Promise<void>
  addLifeArea: (name: string, color: string) => Promise<void>
  removeLifeArea: (id: string) => Promise<void>
  rate: (lifeAreaId: string, month: string, rating: number) => Promise<void>
}

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  lifeAreas: [],
  ratings: [],
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const [goals, lifeAreas, ratings] = await Promise.all([
        api.fetchGoals(),
        api.fetchLifeAreas(),
        api.fetchRatings(),
      ])
      set({ goals, lifeAreas, ratings, loading: false, loaded: true })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  addGoal: async (level, title, parentId) => {
    const goal = await api.createGoal(level, title, parentId)
    set((s) => ({ goals: [...s.goals, goal] }))
  },
  updateGoal: async (id, patch) => {
    const updated = await api.updateGoal(id, patch)
    set((s) => ({ goals: s.goals.map((g) => (g.id === id ? updated : g)) }))
  },
  removeGoal: async (id) => {
    await api.deleteGoal(id)
    set((s) => ({ goals: s.goals.filter((g) => g.id !== id) }))
  },

  addLifeArea: async (name, color) => {
    const area = await api.createLifeArea(name, color)
    set((s) => ({ lifeAreas: [...s.lifeAreas, area] }))
  },
  removeLifeArea: async (id) => {
    await api.deleteLifeArea(id)
    set((s) => ({
      lifeAreas: s.lifeAreas.filter((a) => a.id !== id),
      ratings: s.ratings.filter((r) => r.life_area_id !== id),
    }))
  },
  rate: async (lifeAreaId, month, rating) => {
    const row = await api.upsertRating(lifeAreaId, month, rating)
    set((s) => ({
      ratings: [...s.ratings.filter((r) => !(r.life_area_id === lifeAreaId && r.month === month)), row],
    }))
  },
}))
