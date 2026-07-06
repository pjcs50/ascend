export type GoalLevel = 'vision' | 'yearly' | 'quarterly' | 'monthly' | 'weekly'

export const GOAL_LEVELS: { level: GoalLevel; label: string; hint: string }[] = [
  { level: 'vision', label: 'Vision', hint: 'Who you are becoming' },
  { level: 'yearly', label: 'This year', hint: 'The 12-month bets' },
  { level: 'quarterly', label: 'This quarter', hint: 'The 90-day focus' },
  { level: 'monthly', label: 'This month', hint: 'What moves it forward' },
  { level: 'weekly', label: 'This week', hint: 'The concrete steps' },
]

export interface Goal {
  id: string
  user_id: string
  level: GoalLevel
  title: string
  notes: string | null
  parent_id: string | null
  done: boolean
  sort_order: number
  created_at: string
}

export interface LifeArea {
  id: string
  user_id: string
  name: string
  color: string | null
  created_at: string
}

export interface LifeAreaRating {
  id: string
  user_id: string
  life_area_id: string
  month: string
  rating: number | null
  created_at: string
}
