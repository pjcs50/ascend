export interface Task {
  id: string
  user_id: string
  title: string
  notes: string | null
  done: boolean
  due_date: string | null
  priority: number // 0 none, 1 low, 2 med, 3 high
  project: string | null
  sort_order: number
  completed_at: string | null
  created_at: string
}

export const PRIORITY = [
  { value: 0, label: 'None', color: '#525252' },
  { value: 1, label: 'Low', color: '#3b82f6' },
  { value: 2, label: 'Medium', color: '#f59e0b' },
  { value: 3, label: 'High', color: '#ef4444' },
]

export interface TaskInput {
  title: string
  due_date?: string | null
  priority?: number
  project?: string | null
}
