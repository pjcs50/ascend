import { supabase } from '../../lib/supabase'

export interface JournalEntry {
  id: string
  user_id: string
  entry_date: string
  content: string | null
  intention: string | null
  mood: number | null
  energy: number | null
  tags: string[]
  created_at: string
}

// The editable fields of a day. Every write sends only the fields that changed.
export interface JournalFields {
  content?: string | null
  intention?: string | null
  mood?: number | null
  energy?: number | null
  tags?: string[]
}

export async function fetchEntries(): Promise<JournalEntry[]> {
  const { data, error } = await supabase
    .from('journal_entries')
    .select('*')
    .order('entry_date', { ascending: false })
  if (error) throw error
  return data as JournalEntry[]
}

// Partial UPDATE by id — only touches the named columns, so no field can clobber
// another (this is why the Command Center note and Journal editor coexist safely).
export async function updateEntry(id: string, patch: JournalFields): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as JournalEntry
}

// Create a day's row (upsert guards against a race where it already exists).
// user_id omitted → DB default auth.uid().
export async function createEntry(date: string, fields: JournalFields): Promise<JournalEntry> {
  const { data, error } = await supabase
    .from('journal_entries')
    .upsert({ entry_date: date, ...fields }, { onConflict: 'user_id,entry_date' })
    .select()
    .single()
  if (error) throw error
  return data as JournalEntry
}
