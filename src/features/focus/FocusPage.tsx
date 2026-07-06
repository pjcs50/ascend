import { useState, useEffect } from 'react'
import { Play, Pause, RotateCcw } from 'lucide-react'
import { useFocusStore } from './focusStore'
import { localDateStr } from '../../lib/date'

const WORK_OPTIONS = [15, 25, 50]
const BREAK_MIN = 5

export function FocusPage() {
  const sessions = useFocusStore((s) => s.sessions)
  const log = useFocusStore((s) => s.log)

  const [workMin, setWorkMin] = useState(25)
  const [mode, setMode] = useState<'work' | 'break'>('work')
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [running, setRunning] = useState(false)
  const [label, setLabel] = useState('')

  const total = (mode === 'work' ? workMin : BREAK_MIN) * 60

  // Tick.
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000)
    return () => clearInterval(id)
  }, [running])

  // Completion → log the work session, then switch modes (paused).
  useEffect(() => {
    if (secondsLeft !== 0 || !running) return
    setRunning(false)
    if (mode === 'work') {
      log(workMin, label.trim() || null)
      setMode('break')
      setSecondsLeft(BREAK_MIN * 60)
    } else {
      setMode('work')
      setSecondsLeft(workMin * 60)
    }
  }, [secondsLeft, running, mode, workMin, label, log])

  function reset() {
    setRunning(false)
    setSecondsLeft(total)
  }
  function pickWork(m: number) {
    setWorkMin(m)
    setMode('work')
    setRunning(false)
    setSecondsLeft(m * 60)
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')
  const progress = total ? 1 - secondsLeft / total : 0

  const today = localDateStr()
  const todaySessions = sessions.filter((s) => localDateStr(new Date(s.started_at)) === today)
  const todayMinutes = todaySessions.reduce((acc, s) => acc + s.minutes, 0)

  const ringColor = mode === 'work' ? '#a855f7' : '#22c55e'

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:px-6">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight">Focus</h1>
        <p className="text-sm text-neutral-500">{mode === 'work' ? 'Deep work' : 'Break'}</p>
      </div>

      {/* Timer ring */}
      <div className="relative mx-auto mb-6 h-64 w-64">
        <svg viewBox="0 0 200 200" className="-rotate-90">
          <circle cx="100" cy="100" r="92" fill="none" stroke="#262626" strokeWidth="8" />
          <circle
            cx="100"
            cy="100"
            r="92"
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 92}
            strokeDashoffset={2 * Math.PI * 92 * (1 - progress)}
            style={{ transition: 'stroke-dashoffset 1s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-5xl font-semibold tabular-nums tracking-tight text-neutral-100">
            {mm}:{ss}
          </div>
          <div className="mt-1 text-xs uppercase tracking-wide text-neutral-500">{mode}</div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-5 flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-950 hover:bg-white"
        >
          {running ? <Pause size={20} /> : <Play size={20} className="ml-0.5" />}
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex h-12 w-12 items-center justify-center rounded-full border border-neutral-700 text-neutral-300 hover:border-neutral-500"
        >
          <RotateCcw size={18} />
        </button>
      </div>

      {/* Work length + label */}
      <div className="mb-6 space-y-3">
        <div className="flex justify-center gap-2">
          {WORK_OPTIONS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => pickWork(m)}
              className={`rounded-lg px-3 py-1 text-sm ${
                workMin === m ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {m}m
            </button>
          ))}
        </div>
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What are you focusing on?"
          className="w-full rounded-lg border border-neutral-800 bg-neutral-900/40 px-3 py-2 text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
        />
      </div>

      {/* Today */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900/40 p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm font-semibold">Today</span>
          <span className="text-xs text-neutral-500">
            {todaySessions.length} session{todaySessions.length === 1 ? '' : 's'} · {todayMinutes} min
          </span>
        </div>
        {todaySessions.length === 0 ? (
          <p className="text-xs text-neutral-600">No focus sessions yet today.</p>
        ) : (
          <div className="space-y-1">
            {todaySessions.map((s) => (
              <div key={s.id} className="flex items-center justify-between text-sm">
                <span className="text-neutral-300">{s.label || 'Focus'}</span>
                <span className="text-xs text-neutral-500">{s.minutes} min</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
