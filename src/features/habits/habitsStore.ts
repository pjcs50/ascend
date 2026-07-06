import { create } from 'zustand'
import * as api from './api'
import type { Habit, HabitLog, HabitInput } from './types'
import { currentMonthRef, type MonthRef } from '../../lib/date'

// Replace or remove the log for a (habit, date) in the local array.
function upsertLocal(
  logs: HabitLog[],
  habitId: string,
  date: string,
  newLog: HabitLog | null,
): HabitLog[] {
  const rest = logs.filter((l) => !(l.habit_id === habitId && l.log_date === date))
  return newLog ? [...rest, newLog] : rest
}

interface HabitsState {
  habits: Habit[]
  logs: HabitLog[]
  loading: boolean
  loaded: boolean
  error: string | null
  selectedMonth: MonthRef // shared by Month grid + Metrics
  load: () => Promise<void>
  setSelectedMonth: (m: MonthRef) => void
  addHabit: (input: HabitInput) => Promise<void>
  editHabit: (id: string, patch: Partial<HabitInput>) => Promise<void>
  removeHabit: (id: string) => Promise<void>
  tickBoolean: (habitId: string, date: string, completed: boolean) => Promise<void>
  setValue: (habitId: string, date: string, value: number | null) => Promise<void>
}

export const useHabitsStore = create<HabitsState>((set) => ({
  habits: [],
  logs: [],
  loading: false,
  loaded: false,
  error: null,
  selectedMonth: currentMonthRef(),

  load: async () => {
    set({ loading: true, error: null })
    try {
      const [habits, logs] = await Promise.all([api.fetchHabits(), api.fetchAllLogs()])
      set({ habits, logs, loading: false, loaded: true })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  setSelectedMonth: (m) => set({ selectedMonth: m }),

  addHabit: async (input) => {
    const habit = await api.createHabit(input)
    set((s) => ({ habits: [...s.habits, habit] }))
  },

  editHabit: async (id, patch) => {
    const updated = await api.updateHabit(id, patch)
    set((s) => ({ habits: s.habits.map((h) => (h.id === id ? updated : h)) }))
  },

  removeHabit: async (id) => {
    await api.archiveHabit(id)
    set((s) => ({ habits: s.habits.filter((h) => h.id !== id) }))
  },

  tickBoolean: async (habitId, date, completed) => {
    const newLog = await api.setBooleanLog(habitId, date, completed)
    set((s) => ({ logs: upsertLocal(s.logs, habitId, date, newLog) }))
  },

  setValue: async (habitId, date, value) => {
    const newLog = await api.setValueLog(habitId, date, value)
    set((s) => ({ logs: upsertLocal(s.logs, habitId, date, newLog) }))
  },
}))
