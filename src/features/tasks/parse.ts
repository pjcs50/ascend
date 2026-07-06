import { localDateStr } from '../../lib/date'

// Quick natural-language parse for the task quick-add. Pulls out:
//   #project        → project
//   !high/!med/!low or p1/p2/p3  → priority (3/2/1)
//   today/tomorrow/tmr, weekday names, "next week" → due_date
// …and returns the cleaned title with those tokens removed.
export interface ParsedQuickAdd {
  title: string
  project: string | null
  priority: number | null
  due_date: string | null
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

  return {
    title: text.replace(/\s+/g, ' ').trim(),
    project,
    priority,
    due_date,
  }
}
