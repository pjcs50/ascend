import { localDateStr } from '../../lib/date'

// Deterministic Todoist-style quick-add parser (no LLM, fully testable).
// Recognizes, in extraction order:
//   #project, !priority/pN, "no date", "every …" recurrence, explicit dates
//   (2026-08-15, jan 27, 27 jan — rolls to next year if passed), relative
//   dates ("in 2 hours/30 min" = clock arithmetic, "in 5 days/3 weeks/2
//   months" = calendar arithmetic), named periods (next week / next weekend /
//   this weekend / end of month), "next <weekday>", today/tomorrow/weekday
//   names, clock times (8pm, 8:30pm, 20:00, at 8, noon, midnight), and
//   dayparts (morning 9am · afternoon 12pm · evening 7pm · night/tonight 10pm).
//
// Rules reproduced from Todoist's documented behavior:
//   • bare time still ahead → today; already passed → tomorrow (exact-minute)
//   • an explicit date is never rolled ("today 8pm" stays today, even overdue)
//   • "at 10" with no am/pm reads as morning (and only after "at" — a bare
//     number like "read 5 pages" is never a time)
//   • "monday" = next occurrence; "next monday" = Monday of the following
//     week when Monday is still ahead this week
//   • recurrence only via unambiguous "every …" — bare "monthly" is NOT
//     parsed, so "Create monthly report" stays a title (no cancel-chip UI,
//     so we avoid the documented false-positive trap entirely)
// Deliberately unsupported: "for 2h" durations (needs a schema column),
// "!7pm" reminders (! is our priority syntax), {deadlines}, every-other/
// every!, bare dd/mm numerics (too title-ambiguous), fixed time zones.
export interface ParsedQuickAdd {
  title: string
  project: string | null
  priority: number | null
  due_date: string | null
  due_time: string | null // 'HH:MM'
  recurrence: string | null // 'daily' | 'weekly' | 'monthly' | 'weekdays'
  no_date: boolean // user typed "no date" — clear any date default
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
const WEEKDAY_NAMES =
  'sunday|monday|tuesday|wednesday|thursday|friday|saturday|sun|mon|tues|tue|weds|wed|thurs|thur|thu|fri|sat'

const MONTHS: Record<string, number> = {
  jan: 0, january: 0, feb: 1, february: 1, mar: 2, march: 2,
  apr: 3, april: 3, may: 4, jun: 5, june: 5, jul: 6, july: 6,
  aug: 7, august: 7, sep: 8, sept: 8, september: 8, oct: 9, october: 9,
  nov: 10, november: 10, dec: 11, december: 11,
}
const MONTH_NAMES =
  'january|february|march|april|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sept|sep|oct|nov|dec'

// Todoist's documented daypart clock times.
const DAYPARTS: Record<string, [number, number]> = {
  morning: [9, 0],
  afternoon: [12, 0],
  evening: [19, 0],
  night: [22, 0],
  tonight: [22, 0],
}

const pad2 = (n: number) => String(n).padStart(2, '0')
const hhmm = (h: number, m: number) => `${pad2(h)}:${pad2(m)}`
const END = '(?=[\\s,.!]|$)'

function addDaysStr(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return localDateStr(d)
}

// Next occurrence of a weekday, excluding today ("friday" on a Friday = next week).
function nextWeekday(target: number): string {
  const diff = (target - new Date().getDay() + 7) % 7 || 7
  return addDaysStr(diff)
}

// "next <weekday>": the following week's if the day is still ahead this week,
// else the next occurrence (Todoist's position-in-week rule).
function weekdayFollowing(target: number): string {
  const dow = new Date().getDay()
  const diff = (target - dow + 7) % 7 || 7
  return addDaysStr(target > dow ? diff + 7 : diff)
}

// Is 'HH:MM' still ahead of the clock right now? (exact-minute comparison)
function isFutureToday(h: number, m: number): boolean {
  const now = new Date()
  return h > now.getHours() || (h === now.getHours() && m > now.getMinutes())
}

// Calendar month arithmetic: Jan 31 + 1 month clamps to Feb 28/29, never Mar 2.
function addMonthsStr(n: number): string {
  const d = new Date()
  const t = new Date(d.getFullYear(), d.getMonth() + n, d.getDate())
  if (t.getMonth() !== (((d.getMonth() + n) % 12) + 12) % 12) {
    return localDateStr(new Date(d.getFullYear(), d.getMonth() + n + 1, 0))
  }
  return localDateStr(t)
}

// A specific month+day: this year, or next year if it already passed.
function monthDayStr(month0: number, day: number, year: number | null): string | null {
  const probe = new Date(year ?? new Date().getFullYear(), month0, day)
  if (probe.getMonth() !== month0) return null // e.g. "feb 31"
  if (year === null && localDateStr(probe) < localDateStr()) {
    return localDateStr(new Date(probe.getFullYear() + 1, month0, day))
  }
  return localDateStr(probe)
}

interface ParsedTime {
  hour: number // 24h when explicit; raw 1–12 when ambiguous
  minute: number
  ambiguous: boolean // no am/pm and not unambiguous 24h
}

// "8pm", "8:30 pm", "20:00", "at 8", "at 8:15", "noon", "midnight".
// Bare numbers without a colon, meridiem, or "at" never parse as a time.
function extractTime(text: string): { rest: string; time: ParsedTime | null } {
  const word = new RegExp(`(?:^|\\s)(?:at\\s+)?(noon|midnight)${END}`, 'i')
  const wm = text.match(word)
  if (wm) {
    return {
      rest: text.replace(word, ' '),
      time: { hour: wm[1].toLowerCase() === 'noon' ? 12 : 0, minute: 0, ambiguous: false },
    }
  }
  const re = new RegExp(
    `(?:^|\\s)(?:at\\s+)?(\\d{1,2}):(\\d{2})\\s*(am|pm)?${END}` +
      `|(?:^|\\s)(?:at\\s+)?(\\d{1,2})\\s*(am|pm)${END}` +
      `|(?:^|\\s)at\\s+(\\d{1,2})${END}`,
    'i',
  )
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
  const maxHour = meridiem ? 12 : 23
  if (hour > maxHour || (meridiem !== null && hour < 1) || minute > 59) {
    return { rest: text, time: null } // nonsense like 25:99 stays in the title
  }
  if (meridiem) {
    return {
      rest: text.replace(re, ' '),
      time: { hour: (hour % 12) + (meridiem === 'pm' ? 12 : 0), minute, ambiguous: false },
    }
  }
  if (hour > 12 || hour === 0) {
    return { rest: text.replace(re, ' '), time: { hour, minute, ambiguous: false } } // 24h
  }
  return { rest: text.replace(re, ' '), time: { hour, minute, ambiguous: true } }
}

export function parseQuickAdd(raw: string): ParsedQuickAdd {
  let text = ` ${raw} `
  let project: string | null = null
  let priority: number | null = null
  let due_date: string | null = null
  let due_time: string | null = null
  let recurrence: string | null = null
  let no_date = false

  text = text.replace(/#(\S+)/, (_, p) => {
    project = p
    return ' '
  })

  text = text.replace(/(?:^|\s)(?:!(high|med|medium|low)|p([1-3]))(?=\s|$)/i, (_, word, pn) => {
    if (word) priority = /high/i.test(word) ? 3 : /low/i.test(word) ? 1 : 2
    else priority = pn === '1' ? 3 : pn === '2' ? 2 : 1
    return ' '
  })

  // "no date" — explicit opt-out beats everything below.
  text = text.replace(new RegExp(`(?:^|\\s)no (?:due )?date${END}`, 'i'), () => {
    no_date = true
    return ' '
  })

  // Recurrence — "every …" only (see header comment for why not bare "monthly").
  const recRe = new RegExp(
    `(?:^|\\s)every\\s+(day|daily|week|weekly|month|monthly|weekdays|weekday|${WEEKDAY_NAMES})${END}`,
    'i',
  )
  text = text.replace(recRe, (_, unit: string) => {
    const u = unit.toLowerCase()
    if (u === 'day' || u === 'daily') recurrence = 'daily'
    else if (u === 'week' || u === 'weekly') recurrence = 'weekly'
    else if (u === 'month' || u === 'monthly') recurrence = 'monthly'
    else if (u === 'weekday' || u === 'weekdays') recurrence = 'weekdays'
    else if (u in WEEKDAYS) {
      // "every monday" = weekly, anchored on the next Monday (today counts).
      recurrence = 'weekly'
      const diff = (WEEKDAYS[u] - new Date().getDay() + 7) % 7
      due_date = addDaysStr(diff)
    }
    return ' '
  })

  // Explicit dates, most specific first. ISO:
  text = text.replace(new RegExp(`(?:^|\\s)(\\d{4})-(\\d{2})-(\\d{2})${END}`), (s, y, mo, d) => {
    const ds = monthDayStr(Number(mo) - 1, Number(d), Number(y))
    if (!ds) return s
    due_date = ds
    return ' '
  })

  // "jan 27 [2027]" / "27 jan [2027]":
  const mdRe = new RegExp(`(?:^|\\s)(${MONTH_NAMES})\\s+(\\d{1,2})(?:\\s+(\\d{4}))?${END}`, 'i')
  const dmRe = new RegExp(`(?:^|\\s)(\\d{1,2})\\s+(${MONTH_NAMES})(?:\\s+(\\d{4}))?${END}`, 'i')
  if (!due_date) {
    text = text.replace(mdRe, (s, mon, d, y) => {
      const ds = monthDayStr(MONTHS[mon.toLowerCase()], Number(d), y ? Number(y) : null)
      if (!ds) return s
      due_date = ds
      return ' '
    })
  }
  if (!due_date) {
    text = text.replace(dmRe, (s, d, mon, y) => {
      const ds = monthDayStr(MONTHS[mon.toLowerCase()], Number(d), y ? Number(y) : null)
      if (!ds) return s
      due_date = ds
      return ' '
    })
  }

  // Relative: clock arithmetic for minutes/hours (sets date AND time),
  // calendar arithmetic for days/weeks/months.
  const relRe = new RegExp(
    `(?:^|\\s)in\\s+(\\d+)\\s*(minutes?|mins?|min|hours?|hrs?|hr|days?|weeks?|wks?|months?|mos?)${END}`,
    'i',
  )
  text = text.replace(relRe, (_, nStr: string, unit: string) => {
    const n = Number(nStr)
    const u = unit.toLowerCase()
    if (u.startsWith('min') || u.startsWith('h')) {
      const t = new Date(Date.now() + n * (u.startsWith('h') ? 3600_000 : 60_000))
      due_date = localDateStr(t)
      due_time = hhmm(t.getHours(), t.getMinutes())
    } else if (u.startsWith('d')) due_date = addDaysStr(n)
    else if (u.startsWith('w')) due_date = addDaysStr(n * 7)
    else due_date = addMonthsStr(n)
    return ' '
  })

  // Named periods (longest first so "next weekend" wins over "next week").
  text = text.replace(new RegExp(`(?:^|\\s)next weekend${END}`, 'i'), () => {
    due_date = addDaysStr(((6 - new Date().getDay() + 7) % 7) + 7)
    return ' '
  })
  text = text.replace(new RegExp(`(?:^|\\s)this weekend${END}`, 'i'), () => {
    due_date = addDaysStr((6 - new Date().getDay() + 7) % 7)
    return ' '
  })
  text = text.replace(new RegExp(`(?:^|\\s)next week${END}`, 'i'), () => {
    due_date = addDaysStr(7)
    return ' '
  })
  text = text.replace(new RegExp(`(?:^|\\s)end of (?:the )?month${END}`, 'i'), () => {
    const d = new Date()
    due_date = localDateStr(new Date(d.getFullYear(), d.getMonth() + 1, 0))
    return ' '
  })

  // "next monday" (following-week rule), then plain date keywords.
  text = text.replace(new RegExp(`(?:^|\\s)next (${WEEKDAY_NAMES})${END}`, 'i'), (_, w: string) => {
    due_date = weekdayFollowing(WEEKDAYS[w.toLowerCase()])
    return ' '
  })
  const dateRe = new RegExp(`(?:^|\\s)(today|tod|tomorrow|tmr|tom|${WEEKDAY_NAMES})${END}`, 'i')
  text = text.replace(dateRe, (_, word: string) => {
    const w = word.toLowerCase()
    if (w === 'today' || w === 'tod') due_date = addDaysStr(0)
    else if (w === 'tomorrow' || w === 'tmr' || w === 'tom') due_date = addDaysStr(1)
    else if (w in WEEKDAYS) due_date = nextWeekday(WEEKDAYS[w])
    return ' '
  })

  // Clock time (after dates so "monday 8pm" resolves against the right day).
  const hadExplicitDate = due_date !== null
  const { rest, time } = extractTime(text)
  if (time) {
    text = rest
    // Ambiguous "at 10" reads as morning (Todoist); "at 12" as noon.
    const h24 = time.ambiguous ? (time.hour === 12 ? 12 : time.hour) : time.hour
    due_time = hhmm(h24, time.minute)
  } else {
    // Dayparts only when no clock time was given.
    const dpRe = new RegExp(`(?:^|\\s)(?:in the\\s+|this\\s+|at\\s+)?(morning|afternoon|evening|tonight|night)${END}`, 'i')
    text = text.replace(dpRe, (_, word: string) => {
      const [h, m] = DAYPARTS[word.toLowerCase()]
      due_time = hhmm(h, m)
      return ' '
    })
  }

  // Roll-forward: ONLY when the date wasn't explicit. "today 8pm" stays today
  // (even overdue); bare "8pm" lands today or rolls to tomorrow past 8pm.
  if (due_time && !hadExplicitDate && !due_date) {
    const [h, m] = due_time.split(':').map(Number)
    due_date = addDaysStr(isFutureToday(h, m) ? 0 : 1)
  }
  // A recurring task with no anchor starts today (Todoist default).
  if (recurrence && !due_date && !no_date) due_date = addDaysStr(0)
  if (no_date) {
    due_date = null
    due_time = null
  }

  return {
    title: text.replace(/\s+/g, ' ').trim(),
    project,
    priority,
    due_date,
    due_time,
    recurrence,
    no_date,
  }
}
