import { supabase } from '../../lib/supabase'
import type { CreedEntry, CreedInput, CreedKind } from './types'

export async function fetchEntries(): Promise<CreedEntry[]> {
  const { data, error } = await supabase
    .from('creed_entries')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as CreedEntry[]
}

export async function createEntry(kind: CreedKind, input: CreedInput): Promise<CreedEntry> {
  // user_id omitted — the DB default auth.uid() fills it (matches RLS WITH CHECK).
  const { data, error } = await supabase
    .from('creed_entries')
    .insert({
      kind,
      title: input.title ?? '',
      body: input.body ?? null,
      incident: input.incident ?? null,
      entry_date: input.entry_date ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as CreedEntry
}

export async function updateEntry(id: string, patch: CreedInput): Promise<CreedEntry> {
  const { data, error } = await supabase
    .from('creed_entries')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as CreedEntry
}

export async function deleteEntry(id: string): Promise<void> {
  const { error } = await supabase.from('creed_entries').delete().eq('id', id)
  if (error) throw error
}
