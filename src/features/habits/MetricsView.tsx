import type { ReactNode } from 'react'
import { motion } from 'motion/react'
import { useHabitsStore } from './habitsStore'
import { logsByDate, currentStreak, longestStreak, monthCompletion, monthAverage } from './metrics'
import { monthLabel } from '../../lib/date'
import { AnimatedNumber } from '../../components/AnimatedNumber'
import type { Habit, HabitLog } from './types'

export function MetricsView({ onEditHabit }: { onEditHabit: (h: Habit) => void }) {
  const habits = useHabitsStore((s) => s.habits)
  const logs = useHabitsStore((s) => s.logs)
  const month = useHabitsStore((s) => s.selectedMonth)

  if (habits.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">No habits yet.</p>
  }

  // Precompute per-habit stats.
  const stats = habits.map((h) => {
    const habitLogs = logs.filter((l) => l.habit_id === h.id)
    const byDate = logsByDate(habitLogs)
    return {
      habit: h,
      logs: habitLogs,
      completion: monthCompletion(h, byDate, month),
      current: currentStreak(h, byDate),
      longest: longestStreak(h, habitLogs),
      average: monthAverage(h, habitLogs, month),
    }
  })

  const ranked = [...stats].sort((a, b) => b.completion - a.completion)
  const best = ranked[0]
  const worst = ranked[ranked.length - 1]

  return (
    <div className="space-y-4">
      {stats.length > 1 && (
        <div className="flex flex-wrap gap-3 text-sm">
          <Highlight label="Best this month" habit={best.habit} pct={best.completion} good />
          <Highlight label="Needs work" habit={worst.habit} pct={worst.completion} />
        </div>
      )}

      <p className="text-xs text-neutral-600">Stats for {monthLabel(month)}</p>

      <div className="grid gap-3 sm:grid-cols-2">
        {stats.map((s) => (
          <MetricCard key={s.habit.id} {...s} onEdit={() => onEditHabit(s.habit)} />
        ))}
      </div>
    </div>
  )
}

function Highlight({
  label,
  habit,
  pct,
  good,
}: {
  label: string
  habit: Habit
  pct: number
  good?: boolean
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2">
      <span className="text-xs text-neutral-500">{label}:</span>
      <span className="text-sm text-neutral-200">
        {habit.icon || '•'} {habit.name}
      </span>
      <span className={`text-sm font-medium ${good ? 'text-green-400' : 'text-amber-400'}`}>
        {Math.round(pct * 100)}%
      </span>
    </div>
  )
}

function MetricCard({
  habit,
  completion,
  current,
  longest,
  average,
  onEdit,
}: {
  habit: Habit
  logs: HabitLog[]
  completion: number
  current: number
  longest: number
  average: number | null
  onEdit: () => void
}) {
  const color = habit.color ?? '#737373'
  return (
    <motion.button
      type="button"
      onClick={onEdit}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4 text-left transition-colors hover:border-neutral-700"
    >
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-sm font-medium text-neutral-100">
          {habit.icon ? `${habit.icon} ` : ''}
          {habit.name}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Stat
          label="Completion"
          value={<AnimatedNumber value={completion * 100} format={(n) => `${Math.round(n)}%`} />}
        />
        <Stat
          label="Streak"
          value={
            <>
              <AnimatedNumber value={current} />🔥
            </>
          }
        />
        <Stat label="Longest" value={<AnimatedNumber value={longest} />} />
      </div>
      {habit.type === 'quantitative' && (
        <div className="mt-2 border-t border-neutral-800 pt-2">
          <Stat
            label={`Avg${habit.unit ? ` (${habit.unit})` : ''}`}
            value={
              average != null ? (
                <AnimatedNumber value={average} format={(n) => (Math.round(n * 10) / 10).toString()} />
              ) : (
                '—'
              )
            }
          />
        </div>
      )}
    </motion.button>
  )
}

function Stat({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <div className="text-lg font-semibold text-neutral-100">{value}</div>
      <div className="text-[11px] text-neutral-500">{label}</div>
    </div>
  )
}
