export type HabitType = 'boolean' | 'quantitative'
export type Frequency = 'daily' | 'weekly' | 'x_per_week'

export interface Habit {
  id: string
  user_id: string
  name: string
  type: HabitType
  unit: string | null
  target: number | null
  frequency: Frequency
  times_per_week: number | null
  color: string | null
  icon: string | null
  sort_order: number
  life_area_id: string | null
  archived: boolean
  created_at: string
}

export interface HabitLog {
  id: string
  user_id: string
  habit_id: string
  log_date: string // YYYY-MM-DD (local)
  completed: boolean | null // for boolean habits
  value: number | null // for quantitative habits
  created_at: string
}

// The subset of fields the user edits when creating/updating a habit.
export interface HabitInput {
  name: string
  type: HabitType
  unit?: string | null
  target?: number | null
  frequency?: Frequency
  color?: string | null
  icon?: string | null
}
