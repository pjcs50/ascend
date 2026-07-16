import { localDateStr } from '../../lib/date'

// Quick natural-language parse for the task quick-add. Pulls out:
//   #project        → project
//   !high/!med/!low or p1/p2/p3  → priority (3/2/1)
//   today/tomorrow/tmr, weekday names, "next week" → due_date
//   8pm / 8:30pm / 20:00 / at 8 / noon / midnight → due_time (Todoist-style:
//   a time with no date lands on today, or tomorrow if it already passed)
// …and returns the cleaned title with those tokens removed.
export interface ParsedQuickAdd {
  title: string
  project: string | null
  priority: number | null
  due_date: string | null
  due_time: string | null // 'HH:MM'
}

const WEEKDAYS: Record<string, number> = {
  sun: 0, sunday: 0,
  mon: 1, monday: 1,
  tue: 2, tues: 2, tuesday: 2,
  wed: 3, weds: 3, wednesday: 3,
  thu: 4, thur: 4, thurs: 4, thursday: 4,
  fri: 5, friday: 5,
  sat: 6, saturday: 6,
}

function addDaysStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return localDateStr(d)
}

function nextWeekday(target: number): string {
  const today = new Date()
  const diff = (target - today.getDay() + 7) % 7 || 7 // next occurrence (not today)
  return addDaysStr(diff)
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const hhmm = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`

// Is 'HH:MM' still ahead of the clock right now?
function isFutureToday(h: number, m: number): boolean {
  const now = new Date()
  return h > now.getHours() || (h === now.getHours() && m > now.getMinutes())
}

interface ParsedTime {
  hour: number // 24h when meridiem known/explicit; raw 1–12 when ambiguous
  minute: number
  ambiguous: boolean // true = no am/pm and not unambiguous 24h ("at 8", "8:30")
}

// Recognizes: "8pm", "8:30 pm", "20:00", "at 8", "at 8:15", "noon", "midnight".
// Bare numbers without a colon, meridiem, or "at" are left alone ("read 5 pages").
function extractTime(text: string): { rest: string; time: ParsedTime | null } {
  const word = /(?:^|\s)(noon|midnight)(?=[\s,.]|$)/i
  const wm = text.match(word)
  if (wm) {
    return {
      rest: text.replace(word, ' '),
      time: { hour: wm[1].toLowerCase() === 'noon' ? 12 : 0, minute: 0, ambiguous: false },
    }
  }

  // One pattern, three shapes: H:MM (meridiem optional), H+meridiem, "at H".
  const re =
    /(?:^|\s)(?:at\s+)?(\d{1,2}):(\d{2})\s*(am|pm)?(?=[\s,.]|$)|(?:^|\s)(?:at\s+)?(\d{1,2})\s*(am|pm)(?=[\s,.]|$)|(?:^|\s)at\s+(\d{1,2})(?=[\s,.]|$)/i
  const m = text.match(re)
  if (!m) return { rest: text, time: null }

  let hour: number
  let minute = 0
  let meridiem: string | null = null
  if (m[1] !== undefined) {
    hour = Number(m[1])
    minute = Number(m[2])
    meridiem = m[3]?.toLowerCase() ?? null
  } else if (m[4] !== undefined) {
    hour = Number(m[4])
    meridiem = m[5].toLowerCase()
  } else {
    hour = Number(m[6])
  }

  // Validate; on nonsense ("25:99"), leave the text untouched.
  const maxHour = meridiem ? 12 : 23
  if (hour > maxHour || (meridiem !== null && hour < 1) || minute > 59) {
    return { rest: text, time: null }
  }

  if (meridiem) {
    const h24 = (hour % 12) + (meridiem === 'pm' ? 12 : 0)
    return { rest: text.replace(re, ' '), time: { hour: h24, minute, ambiguous: false } }
  }
  if (hour > 12 || hour === 0) {
    // 20:00 / 0:30 — unambiguous 24h.
    return { rest: text.replace(re, ' '), time: { hour, minute, ambiguous: false } }
  }
  return { rest: text.replace(re, ' '), time: { hour, minute, ambiguous: true } }
}

// "at 8" with no am/pm → the next upcoming 8 o'clock: today 8am, else today
// 8pm, else tomorrow 8am. Returns the resolved 24h time + days to add.
function resolveAmbiguousToday(hour: number, minute: number): { h: number; addDays: number } {
  const am = hour % 12
  const pm = am + 12
  if (isFutureToday(am, minute)) return { h: am, addDays: 0 }
  if (isFutureToday(pm, minute)) return { h: pm, addDays: 0 }
  return { h: am, addDays: 1 }
}

export function parseQuickAdd(raw: string): ParsedQuickAdd {
  let text = ` ${raw} `
  let project: string | null = null
  let priority: number | null = null
  let due_date: string | null = null

  text = text.replace(/#(\S+)/, (_, p) => {
    project = p
    return ' '
  })

  text = text.replace(/(?:^|\s)(?:!(high|med|medium|low)|p([1-3]))(?=\s|$)/i, (_, word, pn) => {
    if (word) priority = /high/i.test(word) ? 3 : /low/i.test(word) ? 1 : 2
    else priority = pn === '1' ? 3 : pn === '2' ? 2 : 1
    return ' '
  })

  // Only match known date keywords (longest-first) so plain words stay in the title.
  const dateRe =
    /(?:^|\s)(today|tod|tomorrow|tmr|tom|next week|sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|weds|wed|thurs|thur|thu|fri|sat)(?=\s|$)/i
  text = text.replace(dateRe, (_, word) => {
    const w = word.toLowerCase()
    if (w === 'today' || w === 'tod') due_date = addDaysStr(0)
    else if (w === 'tomorrow' || w === 'tmr' || w === 'tom') due_date = addDaysStr(1)
    else if (w === 'next week') due_date = addDaysStr(7)
    else if (w in WEEKDAYS) due_date = nextWeekday(WEEKDAYS[w])
    return ' '
  })

  // Time comes after date so "monday 8pm" resolves against the right day.
  let due_time: string | null = null
  const { rest, time } = extractTime(text)
  if (time) {
    text = rest
    if (!time.ambiguous) {
      due_time = hhmm(time.hour, time.minute)
      // "8pm" with no date → today, or tomorrow if 8pm already passed.
      if (!due_date) due_date = addDaysStr(isFutureToday(time.hour, time.minute) ? 0 : 1)
    } else if (due_date) {
      // "monday at 8" — no clock to compare against; use the human default
      // (1–7 reads as evening, 8–12 as morning).
      const h = time.hour <= 7 ? time.hour + 12 : time.hour % 12 || 12
      due_time = hhmm(h, time.minute)
    } else {
      // "at 8" alone → the next upcoming 8 o'clock.
      const r = resolveAmbiguousToday(time.hour, time.minute)
      due_time = hhmm(r.h, time.minute)
      due_date = addDaysStr(r.addDays)
    }
  }

  return {
    title: text.replace(/\s+/g, ' ').trim(),
    project,
    priority,
    due_date,
    due_time,
  }
}
