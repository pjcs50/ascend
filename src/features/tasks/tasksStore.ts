import { create } from 'zustand'
import * as api from './api'
import type { Task, TaskInput } from './types'

interface TasksState {
  tasks: Task[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  addTask: (input: TaskInput) => Promise<void>
  updateTask: (id: string, patch: Parameters<typeof api.updateTask>[1]) => Promise<void>
  toggle: (id: string, done: boolean) => Promise<void>
  removeTask: (id: string) => Promise<void>
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const tasks = await api.fetchTasks()
      set({ tasks, loading: false, loaded: true })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  addTask: async (input) => {
    const task = await api.createTask(input)
    set((s) => ({ tasks: [...s.tasks, task] }))
  },
  updateTask: async (id, patch) => {
    const updated = await api.updateTask(id, patch)
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }))
  },
  toggle: async (id, done) => {
    const updated = await api.updateTask(id, { done, completed_at: done ? new Date().toISOString() : null })
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }))
  },
  removeTask: async (id) => {
    await api.deleteTask(id)
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) }))
  },
}))
