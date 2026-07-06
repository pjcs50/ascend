import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, Plus, X } from 'lucide-react'
import { usePeopleStore } from './peopleStore'
import { EditableField } from './EditableField'
import { localDateStr, parseLocal } from '../../lib/date'
import type { Person, PersonTrait, PersonLesson } from './types'

const AVATAR_COLORS = ['#a855f7', '#3b82f6', '#14b8a6', '#f59e0b', '#ec4899', '#22c55e']

function avatarColor(id: string): string {
  let sum = 0
  for (const ch of id) sum += ch.charCodeAt(0)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export function PersonCard({ person }: { person: Person }) {
  const [expanded, setExpanded] = useState(false)
  const traits = usePeopleStore((s) => s.traits).filter((t) => t.person_id === person.id)
  const lessons = usePeopleStore((s) => s.lessons).filter((l) => l.person_id === person.id)
  const updatePerson = usePeopleStore((s) => s.updatePerson)

  const set = (field: keyof Person) => (v: string | null) => updatePerson(person.id, { [field]: v })

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center gap-3 p-4 text-left"
      >
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-neutral-950"
          style={{ backgroundColor: avatarColor(person.id) }}
        >
          {person.name.slice(0, 1).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-medium text-neutral-100">{person.name}</div>
          <div className="truncate text-xs text-neutral-500">
            {person.relationship || 'No relationship set'}
            {person.last_interaction ? ` · last spoke ${formatDate(person.last_interaction)}` : ''}
          </div>
        </div>
        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-500 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-4 border-t border-neutral-800 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <EditableField label="Relationship" value={person.relationship} placeholder="Mentor, friend…" onSave={set('relationship')} />
                <EditableField label="How we met" value={person.how_we_met} placeholder="Where it started…" onSave={set('how_we_met')} />
              </div>

              <LastInteraction person={person} onSave={set('last_interaction')} />

              <EditableField label="Qualities to learn from" value={person.qualities_to_learn} placeholder="What they do that I admire…" multiline onSave={set('qualities_to_learn')} />
              <EditableField label="Weak spots to avoid in myself" value={person.weaknesses_to_avoid} placeholder="Traits of theirs I don't want…" multiline onSave={set('weaknesses_to_avoid')} />
              <EditableField label="What they're good at that I'm not" value={person.what_theyre_good_at} placeholder="Their edge…" multiline onSave={set('what_theyre_good_at')} />
              <EditableField label="My thoughts" value={person.my_thoughts} placeholder="Raw notes…" multiline onSave={set('my_thoughts')} />
              <EditableField label="Questions to ask them" value={person.questions_to_ask} placeholder="Things to bring up next time…" multiline onSave={set('questions_to_ask')} />

              <TraitsSection personId={person.id} traits={traits} />
              <LessonsSection personId={person.id} lessons={lessons} />

              <DeletePerson person={person} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function LastInteraction({ person, onSave }: { person: Person; onSave: (v: string | null) => void }) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wide text-neutral-500">Last meaningful interaction</label>
      <input
        type="date"
        value={person.last_interaction ?? ''}
        onChange={(e) => onSave(e.target.value || null)}
        className="mt-1 block rounded-lg bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 outline-none ring-1 ring-transparent focus:ring-neutral-700 [color-scheme:dark]"
      />
    </div>
  )
}

function RatingDots({ value, onPick }: { value: number | null; onPick: (n: number) => void }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onPick(n)}
          aria-label={`Rate ${n}`}
          className="h-3 w-3 rounded-full transition-colors"
          style={{ backgroundColor: value != null && n <= value ? '#a855f7' : '#3a3a3a' }}
        />
      ))}
    </div>
  )
}

function TraitsSection({ personId, traits }: { personId: string; traits: PersonTrait[] }) {
  const setTrait = usePeopleStore((s) => s.setTrait)
  const updateTraitRating = usePeopleStore((s) => s.updateTraitRating)
  const removeTrait = usePeopleStore((s) => s.removeTrait)
  const [newTrait, setNewTrait] = useState('')

  function addNew(rating: number) {
    if (!newTrait.trim()) return
    setTrait(personId, newTrait, rating)
    setNewTrait('')
  }

  return (
    <div className="rounded-xl bg-neutral-900/40 p-3">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-neutral-500">Trait ratings (private, 1–10)</div>
      <div className="space-y-2">
        {traits.map((t) => (
          <div key={t.id} className="flex items-center gap-3">
            <span className="w-28 truncate text-sm text-neutral-300">{t.trait}</span>
            <RatingDots value={t.rating} onPick={(n) => updateTraitRating(t.id, n)} />
            <span className="w-8 text-xs text-neutral-500">{t.rating ?? '—'}/10</span>
            <button type="button" onClick={() => removeTrait(t.id)} className="ml-auto text-neutral-600 hover:text-red-400">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-3">
        <input
          value={newTrait}
          onChange={(e) => setNewTrait(e.target.value)}
          placeholder="Discipline, wit, focus…"
          className="w-28 rounded-lg bg-neutral-900/60 px-2 py-1 text-sm text-neutral-200 outline-none ring-1 ring-transparent focus:ring-neutral-700"
        />
        <RatingDots value={null} onPick={addNew} />
        <span className="text-xs text-neutral-600">pick to add</span>
      </div>
    </div>
  )
}

function LessonsSection({ personId, lessons }: { personId: string; lessons: PersonLesson[] }) {
  const addLesson = usePeopleStore((s) => s.addLesson)
  const removeLesson = usePeopleStore((s) => s.removeLesson)
  const [text, setText] = useState('')

  function add() {
    if (!text.trim()) return
    addLesson(personId, text.trim(), localDateStr())
    setText('')
  }

  return (
    <div className="rounded-xl bg-neutral-900/40 p-3">
      <div className="mb-2 text-[11px] uppercase tracking-wide text-neutral-500">Lessons extracted</div>
      <div className="space-y-2">
        {lessons.map((l) => (
          <div key={l.id} className="flex items-start gap-2 text-sm">
            <span className="mt-0.5 w-14 shrink-0 text-xs text-neutral-600">{formatDate(l.lesson_date)}</span>
            <span className="flex-1 text-neutral-300">{l.lesson}</span>
            <button type="button" onClick={() => removeLesson(l.id)} className="text-neutral-600 hover:text-red-400">
              <X size={14} />
            </button>
          </div>
        ))}
        {lessons.length === 0 && <p className="text-xs text-neutral-600">Nothing logged yet.</p>}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="What did you learn from them?"
          className="flex-1 rounded-lg bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 outline-none ring-1 ring-transparent focus:ring-neutral-700"
        />
        <button type="button" onClick={add} className="rounded-lg bg-neutral-800 p-1.5 text-neutral-300 hover:bg-neutral-700">
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

function DeletePerson({ person }: { person: Person }) {
  const deletePerson = usePeopleStore((s) => s.deletePerson)
  const [confirming, setConfirming] = useState(false)

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-xs text-neutral-600 hover:text-red-400"
      >
        Delete person
      </button>
    )
  }
  return (
    <div className="flex items-center gap-3 rounded-lg border border-red-900/60 bg-red-950/30 px-3 py-2">
      <span className="flex-1 text-xs text-red-300">
        Delete {person.name}? This also permanently wipes their trait ratings and lessons. Can't be undone.
      </span>
      <button type="button" onClick={() => setConfirming(false)} className="text-xs text-neutral-400 hover:text-neutral-200">
        Cancel
      </button>
      <button type="button" onClick={() => deletePerson(person.id)} className="text-xs font-medium text-red-400 hover:text-red-300">
        Delete
      </button>
    </div>
  )
}

function formatDate(d: string): string {
  return parseLocal(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
