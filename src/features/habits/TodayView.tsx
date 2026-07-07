import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Pencil } from 'lucide-react'
import { useHabitsStore } from './habitsStore'
import { isDone, isWeekly, weekProgress } from './metrics'
import { todayStr } from '../../lib/date'
import { PremiumCheckbox } from './PremiumCheckbox'
import type { Habit, HabitLog } from './types'

// Standalone, embeddable checklist of today's habits. The Command Center (step 4)
// renders this directly, so it carries no page chrome of its own.
// onEditHabit is optional: the Habits page passes it so rows are editable;
// embeds (Command Center) can omit it to keep the list read-only.
export function TodayView({ onEditHabit }: { onEditHabit?: (h: Habit) => void }) {
  const habits = useHabitsStore((s) => s.habits)
  const logs = useHabitsStore((s) => s.logs)
  const today = todayStr()

  if (habits.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-neutral-500">
        No habits yet. Add one to start tracking.
      </p>
    )
  }

  return (
    <motion.ul layout className="space-y-2">
      <AnimatePresence initial={false}>
        {habits.map((h, i) => {
          const log = logs.find((l) => l.habit_id === h.id && l.log_date === today)
          const wp = isWeekly(h) ? weekProgress(h, logs) : null
          return (
            <HabitRow
              key={h.id}
              habit={h}
              log={log}
              date={today}
              index={i}
              weekProgress={wp}
              onEdit={onEditHabit ? () => onEditHabit(h) : undefined}
            />
          )
        })}
      </AnimatePresence>
    </motion.ul>
  )
}

function HabitRow({
  habit,
  log,
  date,
  index,
  weekProgress,
  onEdit,
}: {
  habit: Habit
  log: HabitLog | undefined
  date: string
  index: number
  weekProgress: { count: number; target: number } | null
  onEdit?: () => void
}) {
  const done = isDone(habit, log)
  const color = habit.color ?? '#737373'

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ type: 'spring', stiffness: 520, damping: 40, mass: 0.7, delay: Math.min(index * 0.045, 0.3) }}
      className="group flex items-center gap-3 rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2.5">
      <span className="w-5 text-center text-sm">{habit.icon || '•'}</span>
      {onEdit ? (
        <button
          type="button"
          onClick={onEdit}
          title="Edit habit"
          className={`flex-1 truncate text-left text-sm transition-colors hover:text-white ${
            done ? 'text-neutral-500 line-through' : 'text-neutral-100'
          }`}
        >
          {habit.name}
        </button>
      ) : (
        <span
          className={`flex-1 truncate text-sm ${done ? 'text-neutral-500 line-through' : 'text-neutral-100'}`}
        >
          {habit.name}
        </span>
      )}
      {onEdit && (
        <button
          type="button"
          onClick={onEdit}
          title="Edit habit"
          aria-label={`Edit ${habit.name}`}
          className="rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
        >
          <Pencil size={14} />
        </button>
      )}
      {weekProgress && (
        <span
          className="rounded-full px-2 py-0.5 text-[11px]"
          style={{
            backgroundColor: weekProgress.count >= weekProgress.target ? `${color}33` : '#262626',
            color: weekProgress.count >= weekProgress.target ? color : '#a3a3a3',
          }}
        >
          {weekProgress.count}/{weekProgress.target} this wk
        </span>
      )}
      {habit.type === 'boolean' ? (
        <BooleanControl habit={habit} done={done} date={date} color={color} />
      ) : (
        <QuantControl habit={habit} log={log} date={date} done={done} color={color} />
      )}
    </motion.li>
  )
}

function BooleanControl({
  habit,
  done,
  date,
  color,
}: {
  habit: Habit
  done: boolean
  date: string
  color: string
}) {
  const tickBoolean = useHabitsStore((s) => s.tickBoolean)
  return (
    <PremiumCheckbox
      checked={done}
      color={color}
      onToggle={() => tickBoolean(habit.id, date, !done)}
      ariaLabel={done ? 'Mark not done' : 'Mark done'}
    />
  )
}

function QuantControl({
  habit,
  log,
  date,
  done,
  color,
}: {
  habit: Habit
  log: HabitLog | undefined
  date: string
  done: boolean
  color: string
}) {
  const setValue = useHabitsStore((s) => s.setValue)
  const [text, setText] = useState(log?.value != null ? String(log.value) : '')

  // Keep the input in sync if the underlying log changes elsewhere.
  useEffect(() => {
    setText(log?.value != null ? String(log.value) : '')
  }, [log?.value])

  function commit() {
    const trimmed = text.trim()
    const next = trimmed === '' ? null : Number(trimmed)
    const current = log?.value ?? null
    if (next === current) return
    setValue(habit.id, date, next)
  }

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        inputMode="decimal"
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
        }}
        placeholder="0"
        className="w-16 rounded-lg border bg-neutral-900 px-2 py-1 text-right text-sm outline-none focus:border-neutral-500"
        style={{ borderColor: done ? color : '#404040' }}
      />
      {habit.unit && <span className="w-12 text-xs text-neutral-500">{habit.unit}</span>}
      {habit.target != null && (
        <span className="text-xs text-neutral-600">/ {habit.target}</span>
      )}
    </div>
  )
}
