import { Fragment } from 'react'
import { useHabitsStore } from './habitsStore'
import { isDone } from './metrics'
import { daysInMonth, monthDateStr, todayStr } from '../../lib/date'
import type { Habit } from './types'

// Habits as rows, days 1..N as columns — the heatmap. Columns flex to fill the
// available width (minmax(_, 1fr)), so on desktop all days fit with no scrollbar;
// only very narrow screens scroll (with the dark scrollbar from index.css).
export function MonthGridView({ onEditHabit }: { onEditHabit: (h: Habit) => void }) {
  const habits = useHabitsStore((s) => s.habits)
  const logs = useHabitsStore((s) => s.logs)
  const month = useHabitsStore((s) => s.selectedMonth)
  const days = daysInMonth(month)
  const today = todayStr()

  const byKey = new Map(logs.map((l) => [`${l.habit_id}|${l.log_date}`, l]))

  if (habits.length === 0) {
    return <p className="py-8 text-center text-sm text-neutral-500">No habits yet.</p>
  }

  const dayNums = Array.from({ length: days }, (_, i) => i + 1)
  const gridStyle = {
    gridTemplateColumns: `minmax(96px, max-content) repeat(${days}, minmax(22px, 1fr))`,
  }

  return (
    <div className="overflow-x-auto pb-2">
      <div className="grid w-full items-center gap-2" style={gridStyle}>
        {/* Header row: empty corner + day numbers */}
        <div />
        {dayNums.map((d) => (
          <div key={d} className="pb-1 text-center text-[11px] font-medium text-neutral-600">
            {d}
          </div>
        ))}

        {/* One row per habit */}
        {habits.map((h) => {
          const color = h.color ?? '#737373'
          return (
            <Fragment key={h.id}>
              <button
                type="button"
                onClick={() => onEditHabit(h)}
                className="flex items-center gap-2 whitespace-nowrap pr-4 text-left text-sm text-neutral-300 transition-colors hover:text-neutral-100"
              >
                <span className="text-base">{h.icon || '•'}</span>
                {h.name}
              </button>
              {dayNums.map((d) => {
                const date = monthDateStr(month, d)
                const log = byKey.get(`${h.id}|${date}`)
                const done = isDone(h, log)
                const hasLog = !!log
                const isFuture = date > today
                return (
                  <div
                    key={d}
                    title={`${h.name} · ${date}`}
                    className="aspect-square rounded-lg"
                    style={{
                      backgroundColor: done ? color : hasLog ? `${color}40` : '#161616',
                      boxShadow: done ? undefined : 'inset 0 0 0 1px #232323',
                      opacity: isFuture ? 0.35 : 1,
                    }}
                  />
                )
              })}
            </Fragment>
          )
        })}
      </div>
    </div>
  )
}
