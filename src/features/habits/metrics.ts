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

// ── Per-frequency (weekly cadence) — for weekly / x-per-week habits ──────────
// These measure by WEEK instead of by day. A week is Monday-based.

export function isWeekly(habit: Habit): boolean {
  return habit.frequency === 'weekly' || habit.frequency === 'x_per_week'
}

// How many done-days a week-based habit needs to count that week as met.
export function weeklyTarget(habit: Habit): number {
  if (habit.frequency === 'x_per_week') return Math.max(1, habit.times_per_week ?? 3)
  return 1 // weekly
}

export function weekStartStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  const dow = (dt.getDay() + 6) % 7 // 0 = Monday
  dt.setDate(dt.getDate() - dow)
  return localDateStr(dt)
}

function shiftWeek(weekStart: string, weeks: number): string {
  const [y, m, d] = weekStart.split('-').map(Number)
  return localDateStr(new Date(y, m - 1, d + weeks * 7))
}

// Count of done-days per week (weekStart → count) for one habit.
function doneCountByWeek(habit: Habit, logs: HabitLog[]): Map<string, number> {
  const byWeek = new Map<string, number>()
  for (const l of logs) {
    if (l.habit_id !== habit.id || !isDone(habit, l)) continue
    const wk = weekStartStr(l.log_date)
    byWeek.set(wk, (byWeek.get(wk) ?? 0) + 1)
  }
  return byWeek
}

// This week's progress toward the target (for the Today view).
export function weekProgress(habit: Habit, logs: HabitLog[]): { count: number; target: number } {
  const wk = weekStartStr(localDateStr())
  return { count: doneCountByWeek(habit, logs).get(wk) ?? 0, target: weeklyTarget(habit) }
}

// Current streak in WEEKS. If this week isn't met yet, count from last week so an
// incomplete current week doesn't prematurely zero the streak.
export function currentStreakWeekly(habit: Habit, logs: HabitLog[]): number {
  const target = weeklyTarget(habit)
  const byWeek = doneCountByWeek(habit, logs)
  const met = (wk: string) => (byWeek.get(wk) ?? 0) >= target
  let cursor = weekStartStr(localDateStr())
  if (!met(cursor)) cursor = shiftWeek(cursor, -1)
  let streak = 0
  while (met(cursor)) {
    streak++
    cursor = shiftWeek(cursor, -1)
  }
  return streak
}

// Longest run of consecutive met weeks over all history.
export function longestStreakWeekly(habit: Habit, logs: HabitLog[]): number {
  const target = weeklyTarget(habit)
  const byWeek = doneCountByWeek(habit, logs)
  const weeks = [...byWeek.keys()].filter((wk) => (byWeek.get(wk) ?? 0) >= target).sort()
  let longest = 0
  let run = 0
  let prev: string | null = null
  for (const wk of weeks) {
    if (prev && shiftWeek(prev, 1) === wk) run++
    else run = 1
    if (run > longest) longest = run
    prev = wk
  }
  return longest
}

// Completion % over the weeks that touch the elapsed days of the month.
export function monthCompletionWeekly(habit: Habit, logs: HabitLog[], month: MonthRef): number {
  const target = weeklyTarget(habit)
  const elapsed = daysElapsedInMonth(month)
  if (elapsed === 0) return 0
  const byWeek = doneCountByWeek(habit, logs)
  const weeks = new Set<string>()
  for (let day = 1; day <= elapsed; day++) weeks.add(weekStartStr(monthDateStr(month, day)))
  let met = 0
  for (const wk of weeks) if ((byWeek.get(wk) ?? 0) >= target) met++
  return weeks.size ? met / weeks.size : 0
}
