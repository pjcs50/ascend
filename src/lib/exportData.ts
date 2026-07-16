import { supabase } from './supabase'

// Every user-data table in the app (see supabase/schema.sql). RLS scopes all
// reads to the signed-in user, so this is a complete personal backup.
const TABLES = [
  'life_areas',
  'habits',
  'habit_logs',
  'people',
  'person_traits',
  'person_lessons',
  'journal_entries',
  'kb_pages',
  'goals',
  'life_area_ratings',
  'tasks',
  'focus_sessions',
  'creed_entries',
] as const

export interface ExportResult {
  rowCount: number
  tableCount: number
}

// Fetches everything and downloads a single timestamped JSON file.
export async function exportAllData(): Promise<ExportResult> {
  const tables: Record<string, unknown[]> = {}
  let rowCount = 0

  for (const t of TABLES) {
    const { data, error } = await supabase.from(t).select('*')
    if (error) throw new Error(`Export failed on ${t}: ${error.message}`)
    tables[t] = data ?? []
    rowCount += tables[t].length
  }

  const stamp = new Date().toISOString().slice(0, 19).replace(/[T:]/g, '-')
  const payload = { app: 'ascend', exportedAt: new Date().toISOString(), tables }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `ascend-backup-${stamp}.json`
  a.click()
  URL.revokeObjectURL(url)

  return { rowCount, tableCount: TABLES.length }
}
