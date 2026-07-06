import { supabase } from '../../lib/supabase'
import type { Person, PersonTrait, PersonLesson, PersonInput, PersonFields } from './types'

export async function fetchPeople(): Promise<Person[]> {
  const { data, error } = await supabase
    .from('people')
    .select('*')
    .order('created_at', { ascending: true })
  if (error) throw error
  return data as Person[]
}

export async function fetchTraits(): Promise<PersonTrait[]> {
  const { data, error } = await supabase.from('person_traits').select('*')
  if (error) throw error
  return data as PersonTrait[]
}

export async function fetchLessons(): Promise<PersonLesson[]> {
  const { data, error } = await supabase
    .from('person_lessons')
    .select('*')
    .order('lesson_date', { ascending: false })
  if (error) throw error
  return data as PersonLesson[]
}

// user_id omitted → DB default auth.uid() (matches RLS WITH CHECK).
export async function createPerson(input: PersonInput): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .insert({
      name: input.name,
      relationship: input.relationship ?? null,
      how_we_met: input.how_we_met ?? null,
      last_interaction: input.last_interaction ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data as Person
}

// Partial UPDATE by id — only touches the named columns, so per-field save-on-blur
// can't clobber sibling fields.
export async function updatePerson(id: string, patch: Partial<PersonFields>): Promise<Person> {
  const { data, error } = await supabase
    .from('people')
    .update(patch)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as Person
}

// Hard delete. person_traits and person_lessons cascade (ON DELETE CASCADE) — the
// caller must confirm this irreversible wipe first.
export async function deletePerson(id: string): Promise<void> {
  const { error } = await supabase.from('people').delete().eq('id', id)
  if (error) throw error
}

export async function addTrait(
  personId: string,
  trait: string,
  rating: number | null,
): Promise<PersonTrait> {
  const { data, error } = await supabase
    .from('person_traits')
    .insert({ person_id: personId, trait, rating })
    .select()
    .single()
  if (error) throw error
  return data as PersonTrait
}

export async function updateTrait(id: string, rating: number | null): Promise<PersonTrait> {
  const { data, error } = await supabase
    .from('person_traits')
    .update({ rating })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data as PersonTrait
}

export async function deleteTrait(id: string): Promise<void> {
  const { error } = await supabase.from('person_traits').delete().eq('id', id)
  if (error) throw error
}

export async function addLesson(
  personId: string,
  lesson: string,
  lessonDate: string,
): Promise<PersonLesson> {
  // lesson_date passed explicitly (local date) rather than the DB's UTC current_date default.
  const { data, error } = await supabase
    .from('person_lessons')
    .insert({ person_id: personId, lesson, lesson_date: lessonDate })
    .select()
    .single()
  if (error) throw error
  return data as PersonLesson
}

export async function deleteLesson(id: string): Promise<void> {
  const { error } = await supabase.from('person_lessons').delete().eq('id', id)
  if (error) throw error
}
