import { useHabitsStore } from './habitsStore'
import { addMonth, monthLabel } from '../../lib/date'

// Month selector shared by the Month grid and Metrics views (state lives in the store).
export function MonthNav() {
  const month = useHabitsStore((s) => s.selectedMonth)
  const setMonth = useHabitsStore((s) => s.setSelectedMonth)

  const btn =
    'flex h-7 w-7 items-center justify-center rounded-lg border border-neutral-700 text-neutral-400 hover:border-neutral-500 hover:text-neutral-200'

  return (
    <div className="flex items-center gap-3">
      <button type="button" className={btn} onClick={() => setMonth(addMonth(month, -1))} aria-label="Previous month">
        ‹
      </button>
      <span className="min-w-36 text-center text-sm text-neutral-300">{monthLabel(month)}</span>
      <button type="button" className={btn} onClick={() => setMonth(addMonth(month, 1))} aria-label="Next month">
        ›
      </button>
    </div>
  )
}
