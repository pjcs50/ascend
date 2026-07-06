export interface FocusSession {
  id: string
  user_id: string
  minutes: number
  label: string | null
  task_id: string | null
  started_at: string
  created_at: string
}
