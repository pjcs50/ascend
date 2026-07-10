import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, Trash2, Compass, Quote, Lightbulb } from 'lucide-react'
import { useCreedStore } from './creedStore'
import { parseLocal } from '../../lib/date'
import type { CreedEntry } from './types'

const listSpring = { type: 'spring', stiffness: 520, damping: 40, mass: 0.7 } as const

export function CreedPage() {
  const entries = useCreedStore((s) => s.entries)
  const loaded = useCreedStore((s) => s.loaded)
  const error = useCreedStore((s) => s.error)
  const addValue = useCreedStore((s) => s.addValue)
  const addLesson = useCreedStore((s) => s.addLesson)

  const northStar = entries.find((e) => e.kind === 'north_star')
  const values = entries.filter((e) => e.kind === 'value')
  const lessons = entries.filter((e) => e.kind === 'lesson')

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Compass size={20} className="text-neutral-300" />
          Creed
        </h1>
        <p className="text-sm text-neutral-500">
          What you stand for, who you're becoming, and the lessons that shaped you.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}

      {loaded && (
        <div className="space-y-9">
          {/* North Star */}
          <section>
            <SectionHeader icon={<Compass size={14} />} title="North Star" hint="The person I'm becoming" />
            <NorthStarCard entry={northStar} />
          </section>

          {/* Values */}
          <section>
            <SectionHeader
              icon={<Quote size={14} />}
              title="What I stand for"
              hint="The principles I live by"
              onAdd={addValue}
            />
            {values.length === 0 ? (
              <EmptyHint onAdd={addValue} label="Add a value you stand for" />
            ) : (
              <motion.div layout className="space-y-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {values.map((v, i) => (
                    <ValueCard key={v.id} entry={v} index={i} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>

          {/* Lessons */}
          <section>
            <SectionHeader
              icon={<Lightbulb size={14} />}
              title="Lessons learned"
              hint="What incidents taught me"
              onAdd={addLesson}
            />
            {lessons.length === 0 ? (
              <EmptyHint onAdd={addLesson} label="Add a lesson you've learned" />
            ) : (
              <motion.div layout className="space-y-3">
                <AnimatePresence mode="popLayout" initial={false}>
                  {lessons.map((l, i) => (
                    <LessonCard key={l.id} entry={l} index={i} />
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  icon,
  title,
  hint,
  onAdd,
}: {
  icon: React.ReactNode
  title: string
  hint: string
  onAdd?: () => void
}) {
  return (
    <div className="mb-3 flex items-end justify-between">
      <div>
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-neutral-200">
          <span className="text-neutral-500">{icon}</span>
          {title}
        </h2>
        <p className="text-xs text-neutral-600">{hint}</p>
      </div>
      {onAdd && (
        <motion.button
          type="button"
          onClick={onAdd}
          whileTap={{ scale: 0.95 }}
          transition={listSpring}
          className="flex items-center gap-1 rounded-lg border border-neutral-800 bg-neutral-900/60 px-2.5 py-1 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:text-neutral-100"
        >
          <Plus size={13} /> Add
        </motion.button>
      )}
    </div>
  )
}

function EmptyHint({ onAdd, label }: { onAdd: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-neutral-800 py-6 text-sm text-neutral-600 transition-colors hover:border-neutral-700 hover:text-neutral-400"
    >
      <Plus size={15} /> {label}
    </button>
  )
}

// The North Star — a single, prominent, quietly editable statement.
function NorthStarCard({ entry }: { entry: CreedEntry | undefined }) {
  const saveNorthStar = useCreedStore((s) => s.saveNorthStar)
  const [text, setText] = useState(entry?.body ?? '')
  useEffect(() => setText(entry?.body ?? ''), [entry?.body])

  function commit() {
    if (text.trim() === (entry?.body ?? '').trim()) return
    saveNorthStar(text.trim())
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-gradient-to-b from-neutral-900/70 to-neutral-900/30 p-5">
      <AutoTextarea
        value={text}
        onChange={setText}
        onBlur={commit}
        placeholder="In a sentence or two — the person I'm working to become…"
        className="w-full resize-none bg-transparent text-lg font-medium leading-relaxed text-neutral-100 outline-none placeholder:text-neutral-600"
      />
    </div>
  )
}

function ValueCard({ entry, index }: { entry: CreedEntry; index: number }) {
  const update = useCreedStore((s) => s.update)
  const remove = useCreedStore((s) => s.remove)

  return (
    <Card index={index}>
      <div className="flex items-start gap-2">
        <div className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-500" />
        <div className="min-w-0 flex-1">
          <FieldInput
            value={entry.title}
            onCommit={(v) => update(entry.id, { title: v ?? '' })}
            placeholder="The value — e.g. Honesty, Courage, Discipline"
            className="w-full bg-transparent text-sm font-semibold text-neutral-100 outline-none placeholder:font-normal placeholder:text-neutral-600"
          />
          <FieldTextarea
            value={entry.body}
            onCommit={(v) => update(entry.id, { body: v })}
            placeholder="What it means to me and how I live it…"
            className="mt-1 w-full resize-none bg-transparent text-sm leading-relaxed text-neutral-400 outline-none placeholder:text-neutral-600"
          />
        </div>
        <DeleteBtn onClick={() => remove(entry.id)} />
      </div>
    </Card>
  )
}

function LessonCard({ entry, index }: { entry: CreedEntry; index: number }) {
  const update = useCreedStore((s) => s.update)
  const remove = useCreedStore((s) => s.remove)

  return (
    <Card index={index}>
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <FieldInput
            value={entry.title}
            onCommit={(v) => update(entry.id, { title: v ?? '' })}
            placeholder="The lesson — what you now know to be true"
            className="w-full bg-transparent text-sm font-semibold text-neutral-100 outline-none placeholder:font-normal placeholder:text-neutral-600"
          />
          <FieldTextarea
            value={entry.incident}
            onCommit={(v) => update(entry.id, { incident: v })}
            placeholder="The incident that taught it…"
            className="mt-1 w-full resize-none bg-transparent text-sm leading-relaxed text-neutral-400 outline-none placeholder:text-neutral-600"
          />
          <div className="mt-2 flex items-center gap-2">
            <input
              type="date"
              value={entry.entry_date ?? ''}
              onChange={(e) => update(entry.id, { entry_date: e.target.value || null })}
              className="rounded-md bg-neutral-900/60 px-2 py-0.5 text-[11px] text-neutral-400 outline-none [color-scheme:dark]"
            />
            {entry.entry_date && (
              <span className="text-[11px] text-neutral-600">
                {parseLocal(entry.entry_date).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            )}
          </div>
        </div>
        <DeleteBtn onClick={() => remove(entry.id)} />
      </div>
    </Card>
  )
}

function Card({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ ...listSpring, delay: Math.min(index * 0.04, 0.28) }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4"
    >
      {children}
    </motion.div>
  )
}

function DeleteBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Delete"
      className="shrink-0 rounded-md p-1 text-neutral-700 transition-colors hover:text-red-400"
    >
      <Trash2 size={14} />
    </button>
  )
}

// --- Inline-edit primitives: local state, commit on blur, sync when the store
// pushes a genuinely new value (keyed narrowly so it can't stomp active typing).

function FieldInput({
  value,
  onCommit,
  placeholder,
  className,
}: {
  value: string | null
  onCommit: (v: string | null) => void
  placeholder?: string
  className?: string
}) {
  const [text, setText] = useState(value ?? '')
  useEffect(() => setText(value ?? ''), [value])
  return (
    <input
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const next = text.trim() ? text : null
        if ((next ?? '') !== (value ?? '')) onCommit(next)
      }}
      placeholder={placeholder}
      className={className}
    />
  )
}

function FieldTextarea({
  value,
  onCommit,
  placeholder,
  className,
}: {
  value: string | null
  onCommit: (v: string | null) => void
  placeholder?: string
  className?: string
}) {
  const [text, setText] = useState(value ?? '')
  useEffect(() => setText(value ?? ''), [value])
  return (
    <AutoTextarea
      value={text}
      onChange={setText}
      onBlur={() => {
        const next = text.trim() ? text : null
        if ((next ?? '') !== (value ?? '')) onCommit(next)
      }}
      placeholder={placeholder}
      className={className}
    />
  )
}

// Textarea that grows to fit its content — no inner scrollbar, feels native.
function AutoTextarea({
  value,
  onChange,
  onBlur,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  onBlur?: () => void
  placeholder?: string
  className?: string
}) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      rows={1}
      className={className}
    />
  )
}
