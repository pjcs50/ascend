import { supabase } from '../../lib/supabase'
import type { Task, TaskInput } from './types'

export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Task[]
}

export async function createTask(input: TaskInput): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: input.title,
      due_date: input.due_date ?? null,
      priority: input.priority ?? 0,
      project: input.project ?? null,
      recurrence: input.recurrence ?? null,
      // Only sent when set, so inserts keep working on a DB that predates the
      // due_time column (migration is a separate manual step).
      ...(input.due_time ? { due_time: input.due_time } : {}),
    })
    .select()
    .single()
  if (error) throw error
  return data as Task
}

export async function updateTask(
  id: string,
  patch: Partial<Pick<Task, 'title' | 'notes' | 'done' | 'due_date' | 'due_time' | 'priority' | 'project' | 'completed_at'>>,
): Promise<Task> {
  const { data, error } = await supabase.from('tasks').update(patch).eq('id', id).select().single()
  if (error) throw error
  return data as Task
}

export async function deleteTask(id: string): Promise<void> {
  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw error
}
