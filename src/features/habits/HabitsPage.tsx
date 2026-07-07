import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus } from 'lucide-react'
import { useHabitsStore } from './habitsStore'
import { TodayView } from './TodayView'
import { MonthGridView } from './MonthGridView'
import { MetricsView } from './MetricsView'
import { MonthNav } from './MonthNav'
import { HabitFormDialog } from './HabitFormDialog'
import type { Habit } from './types'

type View = 'today' | 'month' | 'metrics'
const VIEWS: { key: View; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'month', label: 'Month' },
  { key: 'metrics', label: 'Metrics' },
]

export function HabitsPage() {
  const loading = useHabitsStore((s) => s.loading)
  const loaded = useHabitsStore((s) => s.loaded)
  const error = useHabitsStore((s) => s.error)
  const [view, setView] = useState<View>('today')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Habit | undefined>(undefined)

  function openNew() {
    setEditing(undefined)
    setDialogOpen(true)
  }
  function openEdit(h: Habit) {
    setEditing(h)
    setDialogOpen(true)
  }

  // The Month grid wants the full width to breathe; Today/Metrics stay more focused.
  const maxW = view === 'month' ? 'max-w-none' : view === 'metrics' ? 'max-w-4xl' : 'max-w-2xl'

  return (
    <div className={`mx-auto px-4 py-6 sm:px-6 ${maxW}`}>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Habits</h1>
        <motion.button
          type="button"
          onClick={openNew}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-white"
        >
          <Plus size={16} />
          New
        </motion.button>
      </div>

      {/* View toggle */}
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="relative inline-flex rounded-lg border border-neutral-800 p-0.5">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => setView(v.key)}
              className="relative rounded-md px-3 py-1.5 text-sm"
            >
              {view === v.key && (
                <motion.span
                  layoutId="view-pill"
                  className="absolute inset-0 rounded-md bg-neutral-800"
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
              <span
                className={`relative transition-colors ${
                  view === v.key ? 'text-neutral-100' : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                {v.label}
              </span>
            </button>
          ))}
        </div>
        {view !== 'today' && <MonthNav />}
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      )}
      {loading && !loaded && <p className="py-8 text-center text-sm text-neutral-500">Loading…</p>}

      {loaded && (
        <>
          {view === 'today' && <TodayView onEditHabit={openEdit} />}
          {view === 'month' && <MonthGridView onEditHabit={openEdit} />}
          {view === 'metrics' && <MetricsView onEditHabit={openEdit} />}
        </>
      )}

      <AnimatePresence>
        {dialogOpen && <HabitFormDialog habit={editing} onClose={() => setDialogOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
