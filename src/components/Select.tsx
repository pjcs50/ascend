import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ChevronDown, Check } from 'lucide-react'

// Custom listbox replacing OS-native <select> dropdowns — same quiet, dark,
// spring-animated language as DatePicker.
const spring = { type: 'spring', stiffness: 520, damping: 38, mass: 0.7 } as const

export interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  value: string
  options: SelectOption[]
  onChange: (v: string) => void
  // Trigger overrides, e.g. full-width form fields vs. compact toolbar chips.
  className?: string
}

export function Select({ value, options, onChange, className }: SelectProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onDown(e: PointerEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [open])

  const current = options.find((o) => o.value === value)

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={
          className ??
          'flex items-center gap-1.5 rounded-lg bg-neutral-900/60 px-2 py-1 text-xs text-neutral-300 outline-none transition-colors hover:bg-neutral-800/80'
        }
      >
        <span className="truncate">{current?.label ?? '—'}</span>
        <ChevronDown
          size={12}
          className={`shrink-0 text-neutral-500 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -4 }}
            transition={spring}
            className="absolute left-0 top-full z-30 mt-2 min-w-full origin-top-left overflow-hidden rounded-xl border border-neutral-800 bg-neutral-950 py-1 shadow-2xl shadow-black/60"
          >
            {options.map((o) => {
              const isSelected = o.value === value
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => {
                    onChange(o.value)
                    setOpen(false)
                  }}
                  className={`flex w-full items-center justify-between gap-3 whitespace-nowrap px-3 py-1.5 text-left text-xs transition-colors ${
                    isSelected ? 'text-neutral-100' : 'text-neutral-400 hover:bg-neutral-900 hover:text-neutral-200'
                  }`}
                >
                  {o.label}
                  {isSelected && <Check size={12} className="shrink-0 text-neutral-300" />}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
