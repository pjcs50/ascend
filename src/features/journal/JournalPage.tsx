import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Search, ChevronDown } from 'lucide-react'
import { useJournalStore } from './journalStore'
import { EntryEditor } from './EntryEditor'
import { todayStr, parseLocal } from '../../lib/date'
import type { JournalEntry, JournalFields } from './api'

const MOOD_EMOJI = ['😞', '😕', '😐', '🙂', '😄']

export function JournalPage() {
  const entries = useJournalStore((s) => s.entries)
  const update = useJournalStore((s) => s.update)
  const loaded = useJournalStore((s) => s.loaded)
  const loading = useJournalStore((s) => s.loading)
  const error = useJournalStore((s) => s.error)

  const today = todayStr()
  const todayEntry = entries.find((e) => e.entry_date === today)

  const [query, setQuery] = useState('')
  const [tagFilter, setTagFilter] = useState<string | null>(null)

  const allTags = [...new Set(entries.flatMap((e) => e.tags))].sort()

  const past = entries
    .filter((e) => e.entry_date !== today)
    .filter((e) => (tagFilter ? e.tags.includes(tagFilter) : true))
    .filter((e) =>
      query.trim() ? (e.content ?? '').toLowerCase().includes(query.trim().toLowerCase()) : true,
    )

  const todayLabel = parseLocal(today).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Journal</h1>
        <p className="text-sm text-neutral-500">A line a day compounds.</p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
      {loading && !loaded && <p className="py-8 text-center text-sm text-neutral-500">Loading…</p>}

      {loaded && (
        <>
          {/* Today */}
          <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5">
            <div className="mb-3 text-xs uppercase tracking-wide text-neutral-500">Today · {todayLabel}</div>
            <EntryEditor entry={todayEntry} onSave={(patch) => update(today, patch)} />
          </div>

          {/* Search + tag filter */}
          {entries.some((e) => e.entry_date !== today) && (
            <div className="mb-4 space-y-3">
              <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3">
                <Search size={15} className="text-neutral-500" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search entries…"
                  className="w-full bg-transparent py-2 text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
                />
              </div>
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {allTags.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setTagFilter(tagFilter === t ? null : t)}
                      className={`rounded-full px-2.5 py-0.5 text-xs transition ${
                        tagFilter === t
                          ? 'bg-neutral-100 text-neutral-950'
                          : 'bg-neutral-800 text-neutral-400 hover:text-neutral-200'
                      }`}
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Past entries */}
          <div className="space-y-3">
            {past.map((e) => (
              <PastEntry key={e.id} entry={e} onSave={(patch) => update(e.entry_date, patch)} />
            ))}
          </div>

          {loaded && past.length === 0 && !query && !tagFilter && (
            <p className="py-10 text-center text-sm text-neutral-600">
              Past entries will appear here as the days go by.
            </p>
          )}
          {(query || tagFilter) && past.length === 0 && (
            <p className="py-10 text-center text-sm text-neutral-600">No matching entries.</p>
          )}
        </>
      )}
    </div>
  )
}

function PastEntry({ entry, onSave }: { entry: JournalEntry; onSave: (patch: JournalFields) => void }) {
  const [expanded, setExpanded] = useState(false)
  const label = parseLocal(entry.entry_date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
      <button type="button" onClick={() => setExpanded((v) => !v)} className="flex w-full items-start gap-3 p-4 text-left">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-neutral-200">{label}</span>
            {entry.mood != null && <span className="text-sm">{MOOD_EMOJI[entry.mood - 1]}</span>}
          </div>
          {entry.content && !expanded && (
            <p className="mt-1 line-clamp-2 text-sm text-neutral-500">{entry.content}</p>
          )}
          {entry.tags.length > 0 && !expanded && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {entry.tags.map((t) => (
                <span key={t} className="text-xs text-neutral-600">#{t}</span>
              ))}
            </div>
          )}
        </div>
        <ChevronDown size={18} className={`shrink-0 text-neutral-500 transition-transform ${expanded ? 'rotate-180' : ''}`} />
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
            <div className="border-t border-neutral-800 p-4">
              <EntryEditor entry={entry} onSave={onSave} contentRows={3} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
