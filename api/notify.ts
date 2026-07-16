import webpush from 'web-push'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Scheduler tick for Ascend's notifications. Called every ~5 min by GitHub
// Actions (.github/workflows/notify.yml) with the x-cron-secret header.
// Decides, in IST, what to send: task reminders (30-min lead), morning
// digest (7:30), evening nudge (21:00), streak guard (22:30).
// Runs with the service-role key — server-side only, never in the client.

// Minimal req/res typing keeps this dependency-free (@vercel/node not needed).
interface Req {
  method?: string
  headers: Record<string, string | string[] | undefined>
}
interface Res {
  status: (n: number) => Res
  json: (body: unknown) => void
}

const TZ = 'Asia/Kolkata'
const LEAD_MIN = 30 // reminder fires this many minutes before due time
const LATE_CUTOFF_MIN = 120 // don't ping for tasks already >2h overdue (first-deploy backlog)
const DIGEST_AT = 7 * 60 + 30
const NUDGE_AT = 21 * 60
const STREAK_AT = 22 * 60 + 30

interface SubRow {
  user_id: string
  endpoint: string
  p256dh: string
  auth: string
}

function istParts(): { date: string; minutes: number } {
  const now = new Date()
  const date = now.toLocaleDateString('en-CA', { timeZone: TZ })
  const [h, m] = now
    .toLocaleTimeString('en-GB', { timeZone: TZ, hour12: false, hour: '2-digit', minute: '2-digit' })
    .split(':')
    .map(Number)
  return { date, minutes: h * 60 + m }
}

function istYesterday(date: string): string {
  const [y, mo, d] = date.split('-').map(Number)
  const t = new Date(Date.UTC(y, mo - 1, d))
  t.setUTCDate(t.getUTCDate() - 1)
  return t.toISOString().slice(0, 10)
}

function fmtTime(t: string): string {
  const [hStr, mStr] = t.split(':')
  const h = Number(hStr)
  const m = Number(mStr)
  const mer = h >= 12 ? 'pm' : 'am'
  const h12 = h % 12 || 12
  return m === 0 ? `${h12}${mer}` : `${h12}:${String(m).padStart(2, '0')}${mer}`
}

interface Payload {
  title: string
  body: string
  url: string
  tag: string
}

async function sendAll(db: SupabaseClient, subs: SubRow[], payload: Payload): Promise<number> {
  const body = JSON.stringify(payload)
  let sent = 0
  for (const s of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        body,
      )
      sent++
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode
      // Gone/expired subscription → prune the row.
      if (code === 404 || code === 410) {
        await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint)
      }
    }
  }
  return sent
}

// Insert-once dedupe: unique dedupe_key makes double-sends physically impossible
// even if two ticks overlap. Returns true only for the tick that wins the insert.
async function claimOnce(db: SupabaseClient, userId: string, kind: string, key: string): Promise<boolean> {
  const { error } = await db.from('notification_log').insert({ user_id: userId, kind, dedupe_key: key })
  return !error
}

export default async function handler(req: Req, res: Res): Promise<void> {
  const secret = req.headers['x-cron-secret']
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    res.status(401).json({ error: 'unauthorized' })
    return
  }

  const missing = [
    'VAPID_PUBLIC_KEY',
    'VAPID_PRIVATE_KEY',
    'VITE_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((k) => !process.env[k])
  if (missing.length) {
    res.status(500).json({ error: `missing env: ${missing.join(', ')}` })
    return
  }

  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT ?? 'mailto:ascend@example.com',
    process.env.VAPID_PUBLIC_KEY as string,
    process.env.VAPID_PRIVATE_KEY as string,
  )
  const db = createClient(
    process.env.VITE_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string,
    { auth: { persistSession: false } },
  )

  const { date: today, minutes } = istParts()
  const out: Record<string, number | string> = { date: today, minutes }

  const { data: subs, error: subErr } = await db.from('push_subscriptions').select('*')
  if (subErr) {
    res.status(500).json({ error: subErr.message })
    return
  }
  if (!subs || subs.length === 0) {
    res.status(200).json({ ...out, note: 'no subscriptions' })
    return
  }
  const userId = (subs as SubRow[])[0].user_id

  // --- Task reminders (30-min lead, exact-minute) -------------------------
  const { data: dueTasks } = await db
    .from('tasks')
    .select('id, title, due_time')
    .eq('done', false)
    .eq('due_date', today)
    .not('due_time', 'is', null)
    .is('reminded_at', null)
  let reminders = 0
  for (const t of dueTasks ?? []) {
    const [h, m] = (t.due_time as string).split(':').map(Number)
    const dueMin = h * 60 + m
    if (minutes < dueMin - LEAD_MIN) continue
    // Inside the window (or past it): mark first so a crash can't double-send.
    await db.from('tasks').update({ reminded_at: new Date().toISOString() }).eq('id', t.id)
    if (minutes <= dueMin + LATE_CUTOFF_MIN) {
      reminders += await sendAll(db, subs as SubRow[], {
        title: `⏰ ${t.title}`,
        body: `Due at ${fmtTime(t.due_time as string)}`,
        url: '/tasks',
        tag: `task-${t.id}`,
      })
    }
  }
  out.reminders = reminders

  // --- Morning digest ------------------------------------------------------
  if (minutes >= DIGEST_AT && (await claimOnce(db, userId, 'digest', `digest-${today}`))) {
    const [{ count: taskCount }, { count: habitCount }, { data: entry }] = await Promise.all([
      db.from('tasks').select('id', { count: 'exact', head: true }).eq('done', false).eq('due_date', today),
      db.from('habits').select('id', { count: 'exact', head: true }).eq('archived', false),
      db.from('journal_entries').select('intention').eq('entry_date', today).maybeSingle(),
    ])
    const lines = [`${taskCount ?? 0} task${taskCount === 1 ? '' : 's'} due · ${habitCount ?? 0} habits to build`]
    const intention = (entry as { intention?: string | null } | null)?.intention
    if (intention) lines.push(`Intention: ${intention}`)
    out.digest = await sendAll(db, subs as SubRow[], {
      title: 'Good morning ☀️',
      body: lines.join('\n'),
      url: '/',
      tag: 'digest',
    })
  }

  // --- Evening nudge (only if something's unfinished) ----------------------
  if (minutes >= NUDGE_AT && (await claimOnce(db, userId, 'nudge', `nudge-${today}`))) {
    const [{ data: dailyHabits }, { data: todayLogs }, { data: entry }] = await Promise.all([
      db.from('habits').select('id, name').eq('archived', false).eq('frequency', 'daily'),
      db.from('habit_logs').select('habit_id').eq('log_date', today),
      db.from('journal_entries').select('content').eq('entry_date', today).maybeSingle(),
    ])
    const loggedIds = new Set((todayLogs ?? []).map((l) => l.habit_id as string))
    const pending = (dailyHabits ?? []).filter((h) => !loggedIds.has(h.id as string))
    const noJournal = !(entry as { content?: string | null } | null)?.content
    const parts: string[] = []
    if (pending.length > 0) parts.push(`${pending.length} habit${pending.length === 1 ? '' : 's'} still open`)
    if (noJournal) parts.push('journal is empty')
    if (parts.length > 0) {
      out.nudge = await sendAll(db, subs as SubRow[], {
        title: 'Evening check-in 🌙',
        body: parts.join(' · '),
        url: pending.length > 0 ? '/habits' : '/journal',
        tag: 'nudge',
      })
    }
  }

  // --- Streak guard (daily boolean habits about to break) ------------------
  if (minutes >= STREAK_AT && (await claimOnce(db, userId, 'streak', `streak-${today}`))) {
    const yesterday = istYesterday(today)
    const [{ data: boolHabits }, { data: logs }] = await Promise.all([
      db.from('habits').select('id, name').eq('archived', false).eq('frequency', 'daily').eq('type', 'boolean'),
      db.from('habit_logs').select('habit_id, log_date').in('log_date', [today, yesterday]),
    ])
    const byDay = { today: new Set<string>(), yest: new Set<string>() }
    for (const l of logs ?? []) {
      if (l.log_date === today) byDay.today.add(l.habit_id as string)
      else byDay.yest.add(l.habit_id as string)
    }
    const atRisk = (boolHabits ?? []).filter((h) => byDay.yest.has(h.id as string) && !byDay.today.has(h.id as string))
    if (atRisk.length > 0) {
      const names = atRisk.map((h) => h.name as string).join(', ')
      out.streak = await sendAll(db, subs as SubRow[], {
        title: '🔥 Streak at risk',
        body: `Still unticked today: ${names}`,
        url: '/habits',
        tag: 'streak',
      })
    }
  }

  res.status(200).json(out)
}
