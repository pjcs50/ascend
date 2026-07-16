export interface Task {
  id: string
  user_id: string
  title: string
  notes: string | null
  done: boolean
  due_date: string | null
  due_time: string | null // 'HH:MM:SS' from Postgres, or null (all-day)
  priority: number // 0 none, 1 low, 2 med, 3 high
  project: string | null
  recurrence: string | null // null | 'daily' | 'weekly' | 'monthly'
  sort_order: number
  completed_at: string | null
  created_at: string
}

export const RECURRENCE_OPTIONS = [
  { value: '', label: "Doesn't repeat" },
  { value: 'daily', label: 'Daily' },
  { value: 'weekdays', label: 'Weekdays (Mon–Fri)' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
]

export const PRIORITY = [
  { value: 0, label: 'None', color: '#525252' },
  { value: 1, label: 'Low', color: '#3b82f6' },
  { value: 2, label: 'Medium', color: '#f59e0b' },
  { value: 3, label: 'High', color: '#ef4444' },
]

export interface TaskInput {
  title: string
  due_date?: string | null
  due_time?: string | null // 'HH:MM'
  priority?: number
  project?: string | null
  recurrence?: string | null
}
