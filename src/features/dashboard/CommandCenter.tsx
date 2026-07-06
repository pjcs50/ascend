import { useEffect, useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { useHabitsStore } from '../habits/habitsStore'
import { isDone, currentStreak, logsByDate } from '../habits/metrics'
import { TodayView } from '../habits/TodayView'
import { useJournalStore } from '../journal/journalStore'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import { todayStr } from '../../lib/date'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 5) return 'Still up'
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Winding down'
}

const rise = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
}

export function CommandCenter() {
  const habits = useHabitsStore((s) => s.habits)
  const logs = useHabitsStore((s) => s.logs)
  const today = todayStr()

  const entries = useJournalStore((s) => s.entries)
  const updateEntry = useJournalStore((s) => s.update)
  const todayEntry = entries.find((e) => e.entry_date === today)
  const intention = todayEntry?.intention ?? ''
  const content = todayEntry?.content ?? ''

  // Today's completion: done ÷ total (reuses isDone so it agrees with Metrics).
  const total = habits.length
  const doneCount = habits.filter((h) =>
    isDone(h, logs.find((l) => l.habit_id === h.id && l.log_date === today)),
  ).length
  const pct = total ? Math.round((doneCount / total) * 100) : 0

  // Best current streak across habits.
  let bestStreak = 0
  let bestStreakName = ''
  for (const h of habits) {
    const s = currentStreak(h, logsByDate(logs.filter((l) => l.habit_id === h.id)))
    if (s > bestStreak) {
      bestStreak = s
      bestStreakName = h.name
    }
  }

  const [intentionText, setIntentionText] = useState(intention)
  const [noteText, setNoteText] = useState(content)
  useEffect(() => setIntentionText(intention), [intention])
  useEffect(() => setNoteText(content), [content])

  const dateLabel = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  function commitIntention(e: FormEvent) {
    e.preventDefault()
    if (intentionText !== intention) updateEntry(today, { intention: intentionText || null })
    ;(document.activeElement as HTMLElement)?.blur()
  }
  function commitNote() {
    if (noteText !== content) updateEntry(today, { content: noteText || null })
  }

  const card = 'rounded-2xl border border-neutral-800 bg-neutral-900/40 p-5'

  return (
    <div className="relative mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* subtle top glow — the one bit of "hero", kept light for a screen seen constantly */}
      <div className="pointer-events-none absolute inset-x-0 -top-10 h-40 bg-gradient-to-b from-neutral-800/25 to-transparent blur-2xl" />

      <motion.header {...rise} transition={{ duration: 0.4 }} className="relative mb-6">
        <p className="text-sm text-neutral-500">{dateLabel}</p>
        <h1 className="text-2xl font-bold tracking-tight">{greeting()}.</h1>
      </motion.header>

      {/* At-a-glance strip */}
      <motion.div
        {...rise}
        transition={{ duration: 0.4, delay: 0.05 }}
        className={`relative mb-4 flex items-center gap-5 ${card}`}
      >
        <ProgressRing pct={pct} />
        <div className="flex-1">
          <div className="text-sm text-neutral-400">
            {doneCount} of {total || 0} habits done today
          </div>
          {bestStreak > 0 ? (
            <div className="mt-1 text-sm text-neutral-300">
              🔥 <span className="font-medium">{bestStreak}-day</span> streak · {bestStreakName}
            </div>
          ) : (
            <div className="mt-1 text-sm text-neutral-600">No active streaks yet — tick something.</div>
          )}
        </div>
      </motion.div>

      {/* Daily intention */}
      <motion.form
        {...rise}
        transition={{ duration: 0.4, delay: 0.1 }}
        onSubmit={commitIntention}
        className={`relative mb-4 ${card}`}
      >
        <label className="text-xs uppercase tracking-wide text-neutral-500">Today's intention</label>
        <input
          value={intentionText}
          onChange={(e) => setIntentionText(e.target.value)}
          onBlur={commitIntention}
          placeholder="What matters most today?"
          className="mt-1.5 w-full bg-transparent text-lg text-neutral-100 outline-none placeholder:text-neutral-600"
        />
      </motion.form>

      {/* Today's habits — reuses the standalone TodayView */}
      <motion.section {...rise} transition={{ duration: 0.4, delay: 0.15 }} className={`relative mb-4 ${card}`}>
        <div className="mb-3 text-xs uppercase tracking-wide text-neutral-500">Today's habits</div>
        <TodayView />
      </motion.section>

      {/* Journal quick-entry */}
      <motion.section {...rise} transition={{ duration: 0.4, delay: 0.2 }} className={`relative ${card}`}>
        <div className="mb-2 text-xs uppercase tracking-wide text-neutral-500">Quick note</div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          onBlur={commitNote}
          rows={3}
          placeholder="Drop a thought — it saves to today's journal."
          className="w-full resize-none bg-transparent text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
        />
      </motion.section>
    </div>
  )
}

function ProgressRing({ pct, size = 84 }: { pct: number; size?: number }) {
  const stroke = 8
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c * (1 - pct / 100)
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#262626" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#22c55e"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
        <AnimatedNumber value={pct} format={(n) => `${Math.round(n)}%`} />
      </div>
    </div>
  )
}
