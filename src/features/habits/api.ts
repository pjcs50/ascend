import { supabase } from '../../lib/supabase'
import type { Habit, HabitLog, HabitInput } from './types'

export async function fetchHabits(): Promise<Habit[]> {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('archived', false)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Habit[]
}

// Single-user app: fetching ALL logs is cheap and lets us compute streaks that
// span arbitrary ranges (not just the selected month). Revisit only if it grows huge.
export async function fetchAllLogs(): Promise<HabitLog[]> {
  const { data, error } = await supabase.from('habit_logs').select('*')
  if (error) throw error
  return data as HabitLog[]
}

export async function createHabit(input: HabitInput): Promise<Habit> {
  // user_id omitted on purpose — the DB default auth.uid() fills it, matching the
  // RLS WITH CHECK path. Sending user_id ourselves invites a 403.
  const { data, error } = await supabase
    .from('habits')
    .insert({
      name: input.name,
      type: input.type,
      unit: input.unit ?? null,
      target: input.target ?? null,
      frequency: input.frequency ?? 'daily',
      times_per_week: input.times_per_week ?? null,
      color: input.color ?? null,
      icon: input.icon ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Habit
}

export async function updateHabit(id: string, patch: Partial<HabitInput>): Promise<Habit> {
  const { data, error } = await supabase
    .from('habits')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Habit
}

export async function archiveHabit(id: string): Promise<void> {
  const { error } = await supabase.from('habits').update({ archived: true }).eq('id', id)
  if (error) throw error
}

async function deleteLog(habitId: string, logDate: string): Promise<void> {
  const { error } = await supabase
    .from('habit_logs')
    .delete()
    .eq('habit_id', habitId)
    .eq('log_date', logDate)
  if (error) throw error
}

// Boolean tick. Un-ticking deletes the row so "no log" stays unambiguous.
export async function setBooleanLog(
  habitId: string,
  logDate: string,
  completed: boolean,
): Promise<HabitLog | null> {
  if (!completed) {
    await deleteLog(habitId, logDate)
    return null
  }
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert(
      { habit_id: habitId, log_date: logDate, completed: true, value: null },
      { onConflict: 'habit_id,log_date' },
    )
    .select()
    .single()
  if (error) throw error
  return data as HabitLog
}

// Quantitative value. Clearing (null / NaN) deletes the row.
export async function setValueLog(
  habitId: string,
  logDate: string,
  value: number | null,
): Promise<HabitLog | null> {
  if (value === null || Number.isNaN(value)) {
    await deleteLog(habitId, logDate)
    return null
  }
  const { data, error } = await supabase
    .from('habit_logs')
    .upsert(
      { habit_id: habitId, log_date: logDate, value, completed: null },
      { onConflict: 'habit_id,log_date' },
    )
    .select()
    .single()
  if (error) throw error
  return data as HabitLog
}
