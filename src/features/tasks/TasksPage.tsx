import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus, X, Flag, Repeat, Copy, Check } from 'lucide-react'
import { useTasksStore } from './tasksStore'
import { PRIORITY, RECURRENCE_OPTIONS } from './types'
import { parseQuickAdd } from './parse'
import { todayStr, parseLocal } from '../../lib/date'
import type { Task } from './types'

// Spring shared by list add / remove / reorder — snappy but soft on the settle.
const listSpring = { type: 'spring', stiffness: 520, damping: 40, mass: 0.7 } as const

export function TasksPage() {
  const tasks = useTasksStore((s) => s.tasks)
  const loaded = useTasksStore((s) => s.loaded)
  const error = useTasksStore((s) => s.error)
  const addTask = useTasksStore((s) => s.addTask)

  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const [priority, setPriority] = useState(0)
  const [recurrence, setRecurrence] = useState('')
  const [showDone, setShowDone] = useState(false)
  const [copied, setCopied] = useState(false)

  async function add() {
    const p = parseQuickAdd(title)
    if (!p.title) return
    setTitle('')
    // Natural-language values win; fall back to the manual selectors.
    await addTask({
      title: p.title,
      project: p.project,
      due_date: p.due_date ?? (due || null),
      priority: p.priority ?? priority,
      recurrence: recurrence || null,
    })
    setDue('')
    setPriority(0)
    setRecurrence('')
  }

  const today = todayStr()
  const active = tasks.filter((t) => !t.done)
  const buckets: { key: string; label: string; items: Task[] }[] = [
    { key: 'overdue', label: 'Overdue', items: active.filter((t) => t.due_date && t.due_date < today) },
    { key: 'today', label: 'Today', items: active.filter((t) => t.due_date === today) },
    { key: 'upcoming', label: 'Upcoming', items: active.filter((t) => t.due_date && t.due_date > today) },
    { key: 'someday', label: 'No date', items: active.filter((t) => !t.due_date) },
  ]
  const sortItems = (items: Task[]) => [...items].sort((a, b) => b.priority - a.priority)
  const done = tasks.filter((t) => t.done)

  async function copyAll() {
    const text = buildTasksExport(buckets, today)
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard blocked (rare on the installed PWA) — no-op; button just won't confirm.
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tasks</h1>
          <p className="text-sm text-neutral-500">Type naturally — dates, !priority, and #project are parsed.</p>
        </div>
        {active.length > 0 && (
          <motion.button
            type="button"
            onClick={copyAll}
            whileTap={{ scale: 0.96 }}
            transition={listSpring}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-neutral-800 bg-neutral-900/60 px-3 py-1.5 text-xs font-medium text-neutral-300 transition-colors hover:border-neutral-700 hover:text-neutral-100"
            title="Copy the whole list as text to paste into the Forge"
          >
            <AnimatePresence mode="wait" initial={false}>
              {copied ? (
                <motion.span
                  key="done"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5 text-green-400"
                >
                  <Check size={13} /> Copied
                </motion.span>
              ) : (
                <motion.span
                  key="copy"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  className="flex items-center gap-1.5"
                >
                  <Copy size={13} /> Copy all
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        )}
      </div>

      {/* Quick add */}
      <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
          placeholder="Add a task…  (try: Email Sam tomorrow !high #work)"
          className="w-full bg-transparent px-2 py-1 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
        />
        <div className="mt-2 flex items-center gap-2 px-1">
          <input
            type="date"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="rounded-lg bg-neutral-900/60 px-2 py-1 text-xs text-neutral-300 outline-none [color-scheme:dark]"
          />
          <select
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
            className="rounded-lg bg-neutral-900/60 px-2 py-1 text-xs text-neutral-300 outline-none"
          >
            {PRIORITY.map((p) => (
              <option key={p.value} value={p.value}>
                {p.value === 0 ? 'No priority' : p.label}
              </option>
            ))}
          </select>
          <select
            value={recurrence}
            onChange={(e) => setRecurrence(e.target.value)}
            className="rounded-lg bg-neutral-900/60 px-2 py-1 text-xs text-neutral-300 outline-none"
          >
            {RECURRENCE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <motion.button
            type="button"
            onClick={add}
            disabled={!parseQuickAdd(title).title}
            whileTap={{ scale: 0.95 }}
            transition={listSpring}
            className="ml-auto flex items-center gap-1 rounded-lg bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-950 hover:bg-white disabled:opacity-40"
          >
            <Plus size={14} /> Add
          </motion.button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loaded && active.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-10 text-center text-sm text-neutral-600"
        >
          Nothing to do. Add a task above.
        </motion.p>
      )}

      {/* Active buckets — sections and rows reflow with spring layout */}
      <motion.div layout className="space-y-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {buckets.map(
            (b) =>
              b.items.length > 0 && (
                <motion.div
                  key={b.key}
                  layout
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={listSpring}
                >
                  <div
                    className={`mb-1.5 text-[11px] uppercase tracking-wide ${
                      b.key === 'overdue' ? 'text-red-400' : 'text-neutral-500'
                    }`}
                  >
                    {b.label}
                  </div>
                  <motion.div layout className="space-y-1">
                    <AnimatePresence mode="popLayout" initial={false}>
                      {sortItems(b.items).map((t, i) => (
                        <TaskRow key={t.id} task={t} index={i} />
                      ))}
                    </AnimatePresence>
                  </motion.div>
                </motion.div>
              ),
          )}
        </AnimatePresence>
      </motion.div>

      {done.length > 0 && (
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="text-xs text-neutral-600 hover:text-neutral-400"
          >
            {showDone ? 'Hide' : 'Show'} {done.length} completed
          </button>
          <AnimatePresence initial={false}>
            {showDone && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-2 space-y-1">
                  {done.map((t, i) => (
                    <TaskRow key={t.id} task={t} index={i} />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

// Builds a clean, paste-ready text dump of the active list for the external Forge.
function buildTasksExport(
  buckets: { key: string; label: string; items: Task[] }[],
  today: string,
): string {
  const lines: string[] = [`# Ascend tasks — exported ${today}`, '']
  let any = false
  for (const b of buckets) {
    if (b.items.length === 0) continue
    any = true
    lines.push(`## ${b.label}`)
    const sorted = [...b.items].sort((a, b2) => b2.priority - a.priority)
    for (const t of sorted) {
      const tags: string[] = []
      if (t.priority > 0) tags.push(PRIORITY[t.priority].label)
      if (t.due_date) tags.push(`due ${t.due_date}`)
      if (t.project) tags.push(`#${t.project}`)
      if (t.recurrence) tags.push(`repeats ${t.recurrence}`)
      const suffix = tags.length ? `  (${tags.join(', ')})` : ''
      lines.push(`- ${t.title}${suffix}`)
    }
    lines.push('')
  }
  return any ? lines.join('\n').trim() : ''
}

function TaskRow({ task, index }: { task: Task; index: number }) {
  const toggle = useTasksStore((s) => s.toggle)
  const updateTask = useTasksStore((s) => s.updateTask)
  const removeTask = useTasksStore((s) => s.removeTask)
  const [title, setTitle] = useState(task.title)
  useEffect(() => setTitle(task.title), [task.title])
  const pr = PRIORITY[task.priority]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ ...listSpring, delay: Math.min(index * 0.035, 0.28) }}
      className="group flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-neutral-900/50"
    >
      <motion.button
        type="button"
        onClick={() => toggle(task.id, !task.done)}
        whileTap={{ scale: 0.8 }}
        transition={{ type: 'spring', stiffness: 600, damping: 20 }}
        className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors"
        style={{ borderColor: task.done ? '#22c55e' : pr.color, backgroundColor: task.done ? '#22c55e' : 'transparent' }}
      >
        <AnimatePresence>
          {task.done && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 22 }}
              className="text-[9px] text-neutral-950"
            >
              ✓
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
      {task.priority > 0 && !task.done && <Flag size={12} className="shrink-0" style={{ color: pr.color }} />}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => title.trim() && title !== task.title && updateTask(task.id, { title: title.trim() })}
        className={`min-w-0 flex-1 bg-transparent text-sm outline-none transition-colors ${task.done ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}
      />
      {task.recurrence && !task.done && (
        <Repeat size={12} className="shrink-0 text-neutral-500" aria-label={`Repeats ${task.recurrence}`} />
      )}
      {task.project && (
        <span className="shrink-0 rounded-full bg-neutral-800 px-2 py-0.5 text-[11px] text-neutral-400">#{task.project}</span>
      )}
      {task.due_date && !task.done && (
        <span className={`shrink-0 text-[11px] ${task.due_date < todayStr() ? 'text-red-400' : 'text-neutral-500'}`}>
          {parseLocal(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      )}
      <button
        type="button"
        onClick={() => removeTask(task.id)}
        className="shrink-0 text-neutral-700 opacity-0 transition-opacity hover:text-red-400 group-hover:opacity-100"
      >
        <X size={14} />
      </button>
    </motion.div>
  )
}
