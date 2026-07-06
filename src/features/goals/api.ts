import { supabase } from '../../lib/supabase'
import type { Goal, GoalLevel, LifeArea, LifeAreaRating } from './types'

export async function fetchGoals(): Promise<Goal[]> {
  const { data, error } = await supabase
    .from('goals')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Goal[]
}

export async function createGoal(level: GoalLevel, title: string, parentId: string | null): Promise<Goal> {
  const { data, error } = await supabase
    .from('goals')
    .insert({ level, title, parent_id: parentId })
    .select()
    .single()
  if (error) throw error
  return data as Goal
}

export async function updateGoal(id: string, patch: Partial<Pick<Goal, 'title' | 'notes' | 'done' | 'parent_id'>>): Promise<Goal> {
  const { data, error } = await supabase.from('goals').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Goal
}

export async function deleteGoal(id: string): Promise<void> {
  const { error } = await supabase.from('goals').delete().eq('id', id)
  if (error) throw error
}

export async function fetchLifeAreas(): Promise<LifeArea[]> {
  const { data, error } = await supabase
    .from('life_areas')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as LifeArea[]
}

export async function createLifeArea(name: string, color: string): Promise<LifeArea> {
  const { data, error } = await supabase.from('life_areas').insert({ name, color }).select().single()
  if (error) throw error
  return data as LifeArea
}

export async function deleteLifeArea(id: string): Promise<void> {
  const { error } = await supabase.from('life_areas').delete().eq('id', id)
  if (error) throw error
}

export async function fetchRatings(): Promise<LifeAreaRating[]> {
  const { data, error } = await supabase.from('life_area_ratings').select('*')
  if (error) throw error
  return data as LifeAreaRating[]
}

// Upsert a rating for (life_area, month).
export async function upsertRating(lifeAreaId: string, month: string, rating: number): Promise<LifeAreaRating> {
  const { data, error } = await supabase
    .from('life_area_ratings')
    .upsert({ life_area_id: lifeAreaId, month, rating }, { onConflict: 'life_area_id,month' })
    .select()
    .single()
  if (error) throw error
  return data as LifeAreaRating
}
