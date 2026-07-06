import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import type { JournalEntry, JournalFields } from './api'

const MOODS = ['😞', '😕', '😐', '🙂', '😄']

// Editor for a single day's entry. Content commits on blur (seed-local pattern);
// mood/energy/tags save immediately on click. All go through `onSave`, which the
// page routes to the journal store's partial-PATCH update — no clobber.
export function EntryEditor({
  entry,
  onSave,
  contentRows = 4,
}: {
  entry: JournalEntry | undefined
  onSave: (patch: JournalFields) => void
  contentRows?: number
}) {
  const [content, setContent] = useState(entry?.content ?? '')
  useEffect(() => setContent(entry?.content ?? ''), [entry?.content])
  const [tagInput, setTagInput] = useState('')

  const mood = entry?.mood ?? null
  const energy = entry?.energy ?? null
  const tags = entry?.tags ?? []

  function commitContent() {
    const next = content.trim() ? content : null
    if ((next ?? '') !== (entry?.content ?? '')) onSave({ content: next })
  }
  function addTag() {
    const t = tagInput.trim().toLowerCase()
    setTagInput('')
    if (!t || tags.includes(t)) return
    onSave({ tags: [...tags, t] })
  }

  return (
    <div className="space-y-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={commitContent}
        rows={contentRows}
        placeholder="How was today? What happened, what did you notice?"
        className="w-full resize-none rounded-xl bg-neutral-900/60 p-3 text-sm text-neutral-200 outline-none ring-1 ring-transparent transition placeholder:text-neutral-600 focus:ring-neutral-700"
      />

      <div className="flex flex-wrap gap-8">
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500">Mood</div>
          <div className="flex gap-1">
            {MOODS.map((m, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSave({ mood: mood === i + 1 ? null : i + 1 })}
                className={`text-xl transition ${mood === i + 1 ? 'scale-110' : 'opacity-35 hover:opacity-70'}`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div>
          <div className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500">Energy</div>
          <div className="flex items-end gap-1 pt-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => onSave({ energy: energy === n ? null : n })}
                aria-label={`Energy ${n}`}
                className="w-3 rounded-sm transition-colors"
                style={{
                  height: 6 + n * 3,
                  backgroundColor: energy != null && n <= energy ? '#22c55e' : '#3a3a3a',
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <div className="mb-1.5 text-[11px] uppercase tracking-wide text-neutral-500">Tags</div>
        <div className="flex flex-wrap items-center gap-1.5">
          {tags.map((t) => (
            <span key={t} className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
              #{t}
              <button type="button" onClick={() => onSave({ tags: tags.filter((x) => x !== t) })} className="text-neutral-500 hover:text-red-400">
                <X size={12} />
              </button>
            </span>
          ))}
          <input
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addTag()
              }
            }}
            onBlur={addTag}
            placeholder="add tag…"
            className="w-24 bg-transparent text-xs text-neutral-300 outline-none placeholder:text-neutral-600"
          />
        </div>
      </div>
    </div>
  )
}
