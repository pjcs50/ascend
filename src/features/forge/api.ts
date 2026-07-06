import { supabase } from '../../lib/supabase'
import type { ForgeItem, ForgePrompt, ForgeStatus, TriageResult } from './types'

export async function fetchItems(): Promise<ForgeItem[]> {
  const { data, error } = await supabase
    .from('forge_items')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data as ForgeItem[]
}

export async function fetchPrompts(): Promise<ForgePrompt[]> {
  const { data, error } = await supabase
    .from('forge_prompts')
    .select('*')
    .order('step_order', { ascending: true })
  if (error) throw error
  return data as ForgePrompt[]
}

export async function createItem(rawText: string): Promise<ForgeItem> {
  const { data, error } = await supabase
    .from('forge_items')
    .insert({ raw_text: rawText })
    .select()
    .single()
  if (error) throw error
  return data as ForgeItem
}

// Writes the parsed battle-plan back onto the item + replaces its prompts.
// This is the engine's write path — any source (copy-paste bridge now, MCP later)
// that produces a TriageResult can call it.
export async function applyTriage(
  itemId: string,
  triage: TriageResult,
): Promise<{ item: ForgeItem; prompts: ForgePrompt[] }> {
  const { data: item, error: e1 } = await supabase
    .from('forge_items')
    .update({
      ai_category: triage.category,
      ai_destination: triage.destination,
      recommended_surface: triage.recommended_surface,
      rationale: triage.rationale,
      effort_estimate: triage.effort_estimate,
      next_action: triage.next_action,
      status: 'triaged',
      triaged_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single()
  if (e1) throw e1

  // Replace any prior prompts (supports re-triage).
  await supabase.from('forge_prompts').delete().eq('forge_item_id', itemId)
  let prompts: ForgePrompt[] = []
  if (triage.prompts.length) {
    const rows = triage.prompts.map((p, i) => ({
      forge_item_id: itemId,
      step_order: i,
      surface: p.surface || null,
      prompt_text: p.prompt,
    }))
    const { data, error: e2 } = await supabase.from('forge_prompts').insert(rows).select()
    if (e2) throw e2
    prompts = data as ForgePrompt[]
  }
  return { item: item as ForgeItem, prompts }
}

export async function setStatus(itemId: string, status: ForgeStatus): Promise<ForgeItem> {
  const { data, error } = await supabase
    .from('forge_items')
    .update({ status })
    .eq('id', itemId)
    .select()
    .single()
  if (error) throw error
  return data as ForgeItem
}

export async function deleteItem(itemId: string): Promise<void> {
  const { error } = await supabase.from('forge_items').delete().eq('id', itemId)
  if (error) throw error
}
