// Pure metric functions over a habit + its logs. Kept side-effect-free so the
// numbers are easy to reason about and hand-verify (streak math is bug-prone).

import { localDateStr, monthDateStr, daysElapsedInMonth, type MonthRef } from '../../lib/date'
import type { Habit, HabitLog } from './types'

// Index a habit's logs by date for O(1) lookup.
export function logsByDate(logs: HabitLog[]): Map<string, HabitLog> {
  const m = new Map<string, HabitLog>()
  for (const l of logs) m.set(l.log_date, l)
  return m
}

// Whether a habit counts as "done" on a day:
//   boolean      → completed === true
//   quantitative → a value is present; if a target is set, value must meet it
export function isDone(habit: Habit, log: HabitLog | undefined): boolean {
  if (!log) return false
  if (habit.type === 'boolean') return log.completed === true
  if (log.value == null) return false
  if (habit.target != null) return log.value >= habit.target
  return true
}

// Current streak: consecutive done-days ending today. If today isn't done yet, we
// start from yesterday so an un-ticked "today" doesn't prematurely zero the streak.
export function currentStreak(habit: Habit, byDate: Map<string, HabitLog>): number {
  const d = new Date()
  if (!isDone(habit, byDate.get(localDateStr(d)))) {
    d.setDate(d.getDate() - 1)
  }
  let streak = 0
  while (isDone(habit, byDate.get(localDateStr(d)))) {
    streak++
    d.setDate(d.getDate() - 1)
  }
  return streak
}

// Longest streak over all history.
export function longestStreak(habit: Habit, logs: HabitLog[]): number {
  const doneDates = logs
    .filter((l) => isDone(habit, l))
    .map((l) => l.log_date)
    .sort()
  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const ds of doneDates) {
    if (prev && isNextDay(prev, ds)) run++
    else run = 1
    if (run > longest) longest = run
    prev = ds
  }
  return longest
}

function isNextDay(a: string, b: string): boolean {
  const [ya, ma, da] = a.split('-').map(Number)
  const next = new Date(ya, ma - 1, da + 1)
  return localDateStr(next) === b
}

// Completion % for a month: done-days ÷ days-elapsed-in-month (0..1).
export function monthCompletion(habit: Habit, byDate: Map<string, HabitLog>, month: MonthRef): number {
  const elapsed = daysElapsedInMonth(month)
  if (elapsed === 0) return 0
  let done = 0
  for (let day = 1; day <= elapsed; day++) {
    if (isDone(habit, byDate.get(monthDateStr(month, day)))) done++
  }
  return done / elapsed
}

// Average logged value for a quantitative habit in a month (null if no data).
export function monthAverage(habit: Habit, logs: HabitLog[], month: MonthRef): number | null {
  if (habit.type !== 'quantitative') return null
  const vals: number[] = []
  for (const l of logs) {
    if (l.habit_id !== habit.id || l.value == null) continue
    const [y, m] = l.log_date.split('-').map(Number)
    if (y === month.year && m - 1 === month.month0) vals.push(l.value)
  }
  if (!vals.length) return null
  return vals.reduce((a, b) => a + b, 0) / vals.length
}
