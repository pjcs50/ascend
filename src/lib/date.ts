// Local-date helpers.
//
// IMPORTANT: habit_logs.log_date must be the user's LOCAL calendar day, never UTC.
// `new Date().toISOString()` yields the UTC day, so a habit ticked at 11pm local
// would be filed on the wrong date. Everything here works in local time.

export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr(): string {
  return localDateStr()
}

// Parse a 'YYYY-MM-DD' string as a LOCAL date (new Date(str) would parse as UTC).
export function parseLocal(ds: string): Date {
  const [y, m, d] = ds.split('-').map(Number)
  return new Date(y, m - 1, d)
}

// A month is identified by year + zero-based month index (0 = January).
export interface MonthRef {
  year: number
  month0: number
}

export function currentMonthRef(): MonthRef {
  const d = new Date()
  return { year: d.getFullYear(), month0: d.getMonth() }
}

export function daysInMonth(m: MonthRef): number {
  return new Date(m.year, m.month0 + 1, 0).getDate()
}

export function monthDateStr(m: MonthRef, day: number): string {
  const mm = String(m.month0 + 1).padStart(2, '0')
  const dd = String(day).padStart(2, '0')
  return `${m.year}-${mm}-${dd}`
}

export function monthLabel(m: MonthRef): string {
  return new Date(m.year, m.month0, 1).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  })
}

export function addMonth(m: MonthRef, delta: number): MonthRef {
  const d = new Date(m.year, m.month0 + delta, 1)
  return { year: d.getFullYear(), month0: d.getMonth() }
}

export function isSameMonth(a: MonthRef, b: MonthRef): boolean {
  return a.year === b.year && a.month0 === b.month0
}

// Days elapsed in the month, used as the denominator for completion %:
//   past month    → all days
//   current month → up to today
//   future month  → 0
export function daysElapsedInMonth(m: MonthRef): number {
  const now = new Date()
  const cur: MonthRef = { year: now.getFullYear(), month0: now.getMonth() }
  if (m.year < cur.year || (m.year === cur.year && m.month0 < cur.month0)) {
    return daysInMonth(m)
  }
  if (isSameMonth(m, cur)) {
    return now.getDate()
  }
  return 0
}
