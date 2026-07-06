import { create } from 'zustand'
import * as api from './api'
import type { Person, PersonTrait, PersonLesson, PersonInput, PersonFields } from './types'

interface PeopleState {
  people: Person[]
  traits: PersonTrait[]
  lessons: PersonLesson[]
  loading: boolean
  loaded: boolean
  error: string | null
  load: () => Promise<void>
  addPerson: (input: PersonInput) => Promise<Person>
  updatePerson: (id: string, patch: Partial<PersonFields>) => Promise<void>
  deletePerson: (id: string) => Promise<void>
  setTrait: (personId: string, trait: string, rating: number | null) => Promise<void>
  updateTraitRating: (id: string, rating: number | null) => Promise<void>
  removeTrait: (id: string) => Promise<void>
  addLesson: (personId: string, lesson: string, date: string) => Promise<void>
  removeLesson: (id: string) => Promise<void>
}

export const usePeopleStore = create<PeopleState>((set, get) => ({
  people: [],
  traits: [],
  lessons: [],
  loading: false,
  loaded: false,
  error: null,

  load: async () => {
    set({ loading: true, error: null })
    try {
      const [people, traits, lessons] = await Promise.all([
        api.fetchPeople(),
        api.fetchTraits(),
        api.fetchLessons(),
      ])
      set({ people, traits, lessons, loading: false, loaded: true })
    } catch (e) {
      set({ loading: false, error: (e as Error).message })
    }
  },

  addPerson: async (input) => {
    const person = await api.createPerson(input)
    set((s) => ({ people: [...s.people, person] }))
    return person
  },

  updatePerson: async (id, patch) => {
    const updated = await api.updatePerson(id, patch)
    set((s) => ({ people: s.people.map((p) => (p.id === id ? updated : p)) }))
  },

  deletePerson: async (id) => {
    await api.deletePerson(id)
    set((s) => ({
      people: s.people.filter((p) => p.id !== id),
      traits: s.traits.filter((t) => t.person_id !== id),
      lessons: s.lessons.filter((l) => l.person_id !== id),
    }))
  },

  // Add a trait, or update the rating if a trait with the same name already exists
  // for this person (there's no unique constraint, so we dedupe by name here).
  setTrait: async (personId, trait, rating) => {
    const existing = get().traits.find(
      (t) => t.person_id === personId && t.trait.toLowerCase() === trait.trim().toLowerCase(),
    )
    if (existing) {
      const updated = await api.updateTrait(existing.id, rating)
      set((s) => ({ traits: s.traits.map((t) => (t.id === existing.id ? updated : t)) }))
    } else {
      const created = await api.addTrait(personId, trait.trim(), rating)
      set((s) => ({ traits: [...s.traits, created] }))
    }
  },

  updateTraitRating: async (id, rating) => {
    const updated = await api.updateTrait(id, rating)
    set((s) => ({ traits: s.traits.map((t) => (t.id === id ? updated : t)) }))
  },

  removeTrait: async (id) => {
    await api.deleteTrait(id)
    set((s) => ({ traits: s.traits.filter((t) => t.id !== id) }))
  },

  addLesson: async (personId, lesson, date) => {
    const created = await api.addLesson(personId, lesson, date)
    set((s) => ({ lessons: [created, ...s.lessons] }))
  },

  removeLesson: async (id) => {
    await api.deleteLesson(id)
    set((s) => ({ lessons: s.lessons.filter((l) => l.id !== id) }))
  },
}))
