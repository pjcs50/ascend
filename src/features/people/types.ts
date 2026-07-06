export interface Person {
  id: string
  user_id: string
  name: string
  how_we_met: string | null
  relationship: string | null
  qualities_to_learn: string | null
  weaknesses_to_avoid: string | null
  what_theyre_good_at: string | null
  my_thoughts: string | null
  questions_to_ask: string | null
  last_interaction: string | null // date
  created_at: string
}

export interface PersonTrait {
  id: string
  user_id: string
  person_id: string
  trait: string
  rating: number | null // 1–10
  created_at: string
}

export interface PersonLesson {
  id: string
  user_id: string
  person_id: string
  lesson: string
  lesson_date: string
  created_at: string
}

// Editable free-text / core fields of a person (everything except ids/timestamps).
export type PersonFields = Omit<Person, 'id' | 'user_id' | 'created_at'>

// Fields provided when first creating a person.
export interface PersonInput {
  name: string
  relationship?: string | null
  how_we_met?: string | null
  last_interaction?: string | null
}
