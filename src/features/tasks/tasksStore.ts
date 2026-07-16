import { create } from 'zustand'
import * as api from './api'
import { advanceDate, todayStr } from '../../lib/date'
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

export const useTasksStore = create<TasksState>((set, get) => ({
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
  // Optimistic: flip the checkbox instantly (the tap must feel immediate),
  // then reconcile with the server row; roll back + surface the error if the
  // write fails. Single-user app, so snapshot rollback can't clobber anyone.
  toggle: async (id, done) => {
    const snapshot = get().tasks
    const completed_at = done ? new Date().toISOString() : null
    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === id ? { ...t, done, completed_at } : t)),
      error: null,
    }))
    try {
      const updated = await api.updateTask(id, { done, completed_at })
      set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? updated : t)) }))
      // Completing a recurring task spawns the next occurrence (Todoist-style).
      if (done && updated.recurrence) {
        const base = updated.due_date ?? todayStr()
        const next = await api.createTask({
          title: updated.title,
          due_date: advanceDate(base, updated.recurrence),
          priority: updated.priority,
          project: updated.project,
          recurrence: updated.recurrence,
        })
        set((s) => ({ tasks: [...s.tasks, next] }))
      }
    } catch (e) {
      set({ tasks: snapshot, error: (e as Error).message })
    }
  },
  // Optimistic delete with the same rollback contract.
  removeTask: async (id) => {
    const snapshot = get().tasks
    set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id), error: null }))
    try {
      await api.deleteTask(id)
    } catch (e) {
      set({ tasks: snapshot, error: (e as Error).message })
    }
  },
}))
