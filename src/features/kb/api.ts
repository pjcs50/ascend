import { supabase } from '../../lib/supabase'
import type { KbPage, KbPagePatch } from './types'

export async function fetchPages(): Promise<KbPage[]> {
  const { data, error } = await supabase
    .from('kb_pages')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as KbPage[]
}

export async function createPage(parentId: string | null): Promise<KbPage> {
  const { data, error } = await supabase
    .from('kb_pages')
    .insert({ parent_id: parentId, title: 'Untitled' })
    .select()
    .single()
  if (error) throw error
  return data as KbPage
}

// Partial UPDATE by id — safe per-field save-on-blur, no clobber.
export async function updatePage(id: string, patch: KbPagePatch): Promise<KbPage> {
  const { data, error } = await supabase
    .from('kb_pages')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as KbPage
}

// Hard delete; children cascade (ON DELETE CASCADE on parent_id).
export async function deletePage(id: string): Promise<void> {
  const { error } = await supabase.from('kb_pages').delete().eq('id', id)
  if (error) throw error
}
