import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { useHabitsStore } from './habitsStore'
import { Select } from '../../components/Select'
import type { Habit, HabitType, Frequency, HabitInput } from './types'

const HABIT_COLORS = [
  '#22c55e', // green
  '#3b82f6', // blue
  '#a855f7', // purple
  '#ef4444', // red
  '#f59e0b', // amber
  '#ec4899', // pink
  '#14b8a6', // teal
  '#eab308', // yellow
]

interface Props {
  habit?: Habit // present → edit mode
  onClose: () => void
}

export function HabitFormDialog({ habit, onClose }: Props) {
  const addHabit = useHabitsStore((s) => s.addHabit)
  const editHabit = useHabitsStore((s) => s.editHabit)
  const removeHabit = useHabitsStore((s) => s.removeHabit)

  const [name, setName] = useState(habit?.name ?? '')
  const [type, setType] = useState<HabitType>(habit?.type ?? 'boolean')
  const [unit, setUnit] = useState(habit?.unit ?? '')
  const [target, setTarget] = useState(habit?.target != null ? String(habit.target) : '')
  const [frequency, setFrequency] = useState<Frequency>(habit?.frequency ?? 'daily')
  const [timesPerWeek, setTimesPerWeek] = useState(
    habit?.times_per_week != null ? String(habit.times_per_week) : '3',
  )
  const [color, setColor] = useState(habit?.color ?? HABIT_COLORS[0])
  const [icon, setIcon] = useState(habit?.icon ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    const input: HabitInput = {
      name: name.trim(),
      type,
      frequency,
      times_per_week: frequency === 'x_per_week' ? Number(timesPerWeek) || 3 : null,
      color,
      icon: icon.trim() || null,
      unit: type === 'quantitative' ? unit.trim() || null : null,
      target: type === 'quantitative' && target ? Number(target) : null,
    }
    try {
      if (habit) await editHabit(habit.id, input)
      else await addHabit(input)
      onClose()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  async function handleArchive() {
    if (!habit) return
    setBusy(true)
    try {
      await removeHabit(habit.id)
      onClose()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const field =
    'w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:border-neutral-500'

  return (
    <motion.div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-md space-y-4 rounded-3xl border border-neutral-800 bg-neutral-950 p-5"
      >
        <h2 className="text-lg font-semibold">{habit ? 'Edit habit' : 'New habit'}</h2>

        <div className="space-y-1">
          <label className="text-xs text-neutral-500">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Meditate"
            className={field}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs text-neutral-500">Type</label>
          <div className="flex gap-2">
            {(['boolean', 'quantitative'] as HabitType[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm ${
                  type === t
                    ? 'border-neutral-400 bg-neutral-800 text-neutral-100'
                    : 'border-neutral-700 text-neutral-400 hover:border-neutral-500'
                }`}
              >
                {t === 'boolean' ? 'Yes / No' : 'Number'}
              </button>
            ))}
          </div>
        </div>

        {type === 'quantitative' && (
          <div className="flex gap-3">
            <div className="flex-1 space-y-1">
              <label className="text-xs text-neutral-500">Unit</label>
              <input
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="glasses, min, hrs"
                className={field}
              />
            </div>
            <div className="flex-1 space-y-1">
              <label className="text-xs text-neutral-500">Target (optional)</label>
              <input
                type="number"
                inputMode="decimal"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="8"
                className={field}
              />
            </div>
          </div>
        )}

        <div className="space-y-1">
          <label className="text-xs text-neutral-500">Frequency</label>
          <Select
            value={frequency}
            onChange={(v) => setFrequency(v as Frequency)}
            options={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'x_per_week', label: 'X times per week' },
            ]}
            className={`${field} flex items-center justify-between gap-1.5`}
          />
        </div>

        {frequency === 'x_per_week' && (
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Times per week</label>
            <input
              type="number"
              inputMode="numeric"
              min={1}
              max={7}
              value={timesPerWeek}
              onChange={(e) => setTimesPerWeek(e.target.value)}
              className={field}
            />
          </div>
        )}

        <div className="flex gap-4">
          <div className="space-y-1">
            <label className="text-xs text-neutral-500">Color</label>
            <div className="flex flex-wrap gap-2">
              {HABIT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  style={{ backgroundColor: c }}
                  className={`h-6 w-6 rounded-full ${
                    color === c ? 'ring-2 ring-neutral-100 ring-offset-2 ring-offset-neutral-950' : ''
                  }`}
                />
              ))}
            </div>
          </div>
          <div className="w-20 space-y-1">
            <label className="text-xs text-neutral-500">Icon</label>
            <input
              value={icon}
              onChange={(e) => setIcon(e.target.value)}
              placeholder="🧘"
              maxLength={2}
              className={`${field} text-center`}
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <div className="flex items-center justify-between pt-2">
          {habit ? (
            <button
              type="button"
              onClick={handleArchive}
              disabled={busy}
              className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
            >
              Archive
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy || !name.trim()}
              className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white disabled:opacity-50"
            >
              {busy ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </motion.form>
    </motion.div>
  )
}
