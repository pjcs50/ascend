import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { localDateStr, parseLocal, todayStr } from '../lib/date'

// Custom date picker replacing the OS-native <input type="date"> popup —
// quiet, dark, spring-animated, Monday-first (matching the app's week math).
const spring = { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 } as const
const DOW = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

interface DatePickerProps {
  value: string | null // 'YYYY-MM-DD'
  onChange: (v: string | null) => void
  placeholder?: string
}

export function DatePicker({ value, onChange, placeholder = 'Date' }: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const [view, setView] = useState(() => {
    const d = value ? parseLocal(value) : new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  function toggle() {
    if (!open) {
      const d = value ? parseLocal(value) : new Date()
      setView({ y: d.getFullYear(), m: d.getMonth() })
    }
    setOpen((v) => !v)
  }

  const selected = value ? parseLocal(value) : null
  const label = selected
    ? selected.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        ...(selected.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}),
      })
    : placeholder

  // Monday-first grid; leading blanks instead of prev-month filler (quieter).
  const first = new Date(view.y, view.m, 1)
  const lead = (first.getDay() + 6) % 7
  const count = new Date(view.y, view.m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...(Array(lead).fill(null) as null[]),
    ...Array.from({ length: count }, (_, i) => i + 1),
  ]
  const today = todayStr()
  const monthTitle = first.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })

  function pick(day: number) {
    onChange(localDateStr(new Date(view.y, view.m, day)))
    setOpen(false)
  }
  function shift(delta: number) {
    const d = new Date(view.y, view.m + delta, 1)
    setView({ y: d.getFullYear(), m: d.getMonth() })
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-1.5 rounded-lg bg-neutral-900/60 px-2 py-1 text-xs outline-none transition-colors hover:bg-neutral-800/80 ${
          value ? 'text-neutral-300' : 'text-neutral-500'
        }`}
      >
        <CalendarDays size={12} className="text-neutral-500" />
        {label}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={spring}
            className="absolute left-0 top-full z-30 mt-2 w-[248px] origin-top-left rounded-2xl border border-neutral-800 bg-neutral-950 p-3 shadow-2xl shadow-black/60"
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <span className="text-sm font-medium text-neutral-200">{monthTitle}</span>
              <div className="flex gap-1">
                <NavBtn onClick={() => shift(-1)} aria="Previous month">
                  <ChevronLeft size={14} />
                </NavBtn>
                <NavBtn onClick={() => shift(1)} aria="Next month">
                  <ChevronRight size={14} />
                </NavBtn>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-y-0.5">
              {DOW.map((d, i) => (
                <span key={i} className="pb-1 text-center text-[10px] font-medium text-neutral-600">
                  {d}
                </span>
              ))}
              {cells.map((day, i) => {
                if (day === null) return <span key={`b${i}`} />
                const ds = localDateStr(new Date(view.y, view.m, day))
                const isSelected = ds === value
                const isToday = ds === today
                return (
                  <button
                    key={ds}
                    type="button"
                    onClick={() => pick(day)}
                    className={`mx-auto flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors ${
                      isSelected
                        ? 'bg-neutral-100 font-semibold text-neutral-950'
                        : isToday
                          ? 'font-semibold text-neutral-100 ring-1 ring-inset ring-neutral-700 hover:bg-neutral-800'
                          : 'text-neutral-400 hover:bg-neutral-800 hover:text-neutral-200'
                    }`}
                  >
                    {day}
                  </button>
                )
              })}
            </div>

            <div className="mt-2 flex items-center justify-between border-t border-neutral-800/80 px-1 pt-2">
              <FooterBtn onClick={() => { onChange(null); setOpen(false) }}>Clear</FooterBtn>
              <FooterBtn onClick={() => { onChange(today); setOpen(false) }}>Today</FooterBtn>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function NavBtn({ onClick, aria, children }: { onClick: () => void; aria: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      className="rounded-md p-1 text-neutral-500 transition-colors hover:bg-neutral-800 hover:text-neutral-200"
    >
      {children}
    </button>
  )
}

function FooterBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-md px-1.5 py-0.5 text-xs text-neutral-500 transition-colors hover:text-neutral-200"
    >
      {children}
    </button>
  )
}
