import { useState, useEffect } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { useGoalsStore } from './goalsStore'
import { WheelOfLife } from './WheelOfLife'
import { GOAL_LEVELS } from './types'
import { localDateStr } from '../../lib/date'
import type { Goal, GoalLevel } from './types'

const AREA_COLORS = ['#a855f7', '#3b82f6', '#22c55e', '#f59e0b', '#ec4899', '#14b8a6', '#ef4444', '#eab308']

export function GoalsPage() {
  const loaded = useGoalsStore((s) => s.loaded)
  const error = useGoalsStore((s) => s.error)
  const month = localDateStr().slice(0, 7)

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-2xl font-bold tracking-tight">Goals & Vision</h1>
        <p className="text-sm text-neutral-500">Ladder your days up to who you're becoming.</p>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loaded && (
        <>
          <div className="space-y-3">
            {GOAL_LEVELS.map((l, i) => (
              <GoalSection key={l.level} level={l.level} label={l.label} hint={l.hint} parentLevel={GOAL_LEVELS[i - 1]?.level} />
            ))}
          </div>

          <div className="mt-8">
            <h2 className="mb-1 text-lg font-semibold">Wheel of Life</h2>
            <p className="mb-3 text-sm text-neutral-500">Rate each area 1–10 for {month}.</p>
            <WheelPanel month={month} />
          </div>
        </>
      )}
    </div>
  )
}

function GoalSection({
  level,
  label,
  hint,
  parentLevel,
}: {
  level: GoalLevel
  label: string
  hint: string
  parentLevel?: GoalLevel
}) {
  const goals = useGoalsStore((s) => s.goals)
  const addGoal = useGoalsStore((s) => s.addGoal)
  const [text, setText] = useState('')
  const mine = goals.filter((g) => g.level === level)
  const parents = parentLevel ? goals.filter((g) => g.level === parentLevel) : []

  async function add() {
    const t = text.trim()
    if (!t) return
    setText('')
    await addGoal(level, t, null)
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="text-sm font-semibold text-neutral-100">{label}</span>
        <span className="text-[11px] text-neutral-600">{hint}</span>
      </div>
      <div className="space-y-1.5">
        {mine.map((g) => (
          <GoalRow key={g.id} goal={g} parents={parents} />
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder={`Add a ${label.toLowerCase()} goal…`}
          className="flex-1 rounded-lg bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 outline-none ring-1 ring-transparent focus:ring-neutral-700 placeholder:text-neutral-600"
        />
        <button type="button" onClick={add} className="rounded-lg bg-neutral-800 p-1.5 text-neutral-300 hover:bg-neutral-700">
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}

function GoalRow({ goal, parents }: { goal: Goal; parents: Goal[] }) {
  const updateGoal = useGoalsStore((s) => s.updateGoal)
  const removeGoal = useGoalsStore((s) => s.removeGoal)
  const [title, setTitle] = useState(goal.title)
  useEffect(() => setTitle(goal.title), [goal.title])
  const parent = parents.find((p) => p.id === goal.parent_id)

  return (
    <div className="group flex items-center gap-2">
      <button
        type="button"
        onClick={() => updateGoal(goal.id, { done: !goal.done })}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded border border-neutral-600"
        style={{ backgroundColor: goal.done ? '#a855f7' : 'transparent', borderColor: goal.done ? '#a855f7' : undefined }}
      >
        {goal.done && <Check size={11} className="text-neutral-950" />}
      </button>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== goal.title && updateGoal(goal.id, { title: title.trim() })}
        className={`flex-1 bg-transparent text-sm outline-none ${goal.done ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}
      />
      {parents.length > 0 && (
        <select
          value={goal.parent_id ?? ''}
          onChange={(e) => updateGoal(goal.id, { parent_id: e.target.value || null })}
          className="max-w-[120px] shrink-0 rounded bg-neutral-800 px-1.5 py-0.5 text-[11px] text-neutral-400 outline-none"
          title={parent ? `Ladders up to: ${parent.title}` : 'Link to a parent goal'}
        >
          <option value="">— link up —</option>
          {parents.map((p) => (
            <option key={p.id} value={p.id}>
              ↑ {p.title}
            </option>
          ))}
        </select>
      )}
      <button
        type="button"
        onClick={() => removeGoal(goal.id)}
        className="shrink-0 text-neutral-700 opacity-0 hover:text-red-400 group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function WheelPanel({ month }: { month: string }) {
  const lifeAreas = useGoalsStore((s) => s.lifeAreas)
  const ratings = useGoalsStore((s) => s.ratings)
  const rate = useGoalsStore((s) => s.rate)
  const addLifeArea = useGoalsStore((s) => s.addLifeArea)
  const removeLifeArea = useGoalsStore((s) => s.removeLifeArea)

  const [name, setName] = useState('')
  const [color, setColor] = useState(AREA_COLORS[0])

  const ratingFor = (areaId: string): number | null =>
    ratings.find((r) => r.life_area_id === areaId && r.month === month)?.rating ?? null

  async function add() {
    const t = name.trim()
    if (!t) return
    setName('')
    await addLifeArea(t, color)
  }

  return (
    <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
      <WheelOfLife areas={lifeAreas} ratingFor={ratingFor} />

      <div className="mt-4 space-y-2">
        {lifeAreas.map((a) => (
          <div key={a.id} className="group flex items-center gap-3">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: a.color ?? '#737373' }} />
            <span className="w-24 shrink-0 truncate text-sm text-neutral-300">{a.name}</span>
            <div className="flex flex-1 gap-1">
              {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => rate(a.id, month, n)}
                  aria-label={`Rate ${a.name} ${n}`}
                  className="h-3 flex-1 rounded-sm transition-colors"
                  style={{ backgroundColor: (ratingFor(a.id) ?? 0) >= n ? (a.color ?? '#a855f7') : '#333' }}
                />
              ))}
            </div>
            <span className="w-6 shrink-0 text-right text-xs text-neutral-500">{ratingFor(a.id) ?? '—'}</span>
            <button type="button" onClick={() => removeLifeArea(a.id)} className="shrink-0 text-neutral-700 opacity-0 hover:text-red-400 group-hover:opacity-100">
              <X size={13} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-neutral-800 pt-3">
        <div className="flex gap-1">
          {AREA_COLORS.slice(0, 5).map((cc) => (
            <button
              key={cc}
              type="button"
              onClick={() => setColor(cc)}
              className={`h-4 w-4 rounded-full ${color === cc ? 'ring-2 ring-neutral-100 ring-offset-1 ring-offset-neutral-950' : ''}`}
              style={{ backgroundColor: cc }}
            />
          ))}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a life area (Health, Career…)"
          className="flex-1 rounded-lg bg-neutral-900/60 px-3 py-1.5 text-sm text-neutral-200 outline-none ring-1 ring-transparent focus:ring-neutral-700 placeholder:text-neutral-600"
        />
        <button type="button" onClick={add} className="rounded-lg bg-neutral-800 p-1.5 text-neutral-300 hover:bg-neutral-700">
          <Plus size={15} />
        </button>
      </div>
    </div>
  )
}
