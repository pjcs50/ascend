export type CreedKind = 'north_star' | 'value' | 'lesson'

export interface CreedEntry {
  id: string
  user_id: string
  kind: CreedKind
  title: string
  body: string | null
  incident: string | null // lessons: the incident that taught it
  entry_date: string | null // lessons: 'YYYY-MM-DD'
  sort_order: number
  created_at: string
}

// Fields a caller may set when creating/updating an entry.
export interface CreedInput {
  title?: string
  body?: string | null
  incident?: string | null
  entry_date?: string | null
}
