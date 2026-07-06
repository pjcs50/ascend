import { motion } from 'motion/react'

// Premium boolean tick: spring-scaled fill + a checkmark that draws itself.
// Kept intentionally FAST (this is tapped dozens of times a day — a long
// animation gets tiring). Purely presentational; the caller owns the toggle.
export function PremiumCheckbox({
  checked,
  color,
  onToggle,
  ariaLabel,
  size = 28,
}: {
  checked: boolean
  color: string
  onToggle: () => void
  ariaLabel: string
  size?: number
}) {
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-label={ariaLabel}
      aria-pressed={checked}
      whileTap={{ scale: 0.82 }}
      transition={{ type: 'spring', stiffness: 600, damping: 20 }}
      className="relative flex shrink-0 items-center justify-center rounded-full outline-none"
      style={{ height: size, width: size }}
    >
      {/* Resting outline ring (fades out as it fills) */}
      <motion.span
        className="absolute inset-0 rounded-full border-2"
        style={{ borderColor: color }}
        initial={false}
        animate={{ opacity: checked ? 0 : 0.55 }}
        transition={{ duration: 0.15 }}
      />
      {/* Filled disc springs in */}
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
        initial={false}
        animate={{ scale: checked ? 1 : 0.4, opacity: checked ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
      />
      {/* Checkmark draws on */}
      <svg viewBox="0 0 24 24" className="relative" width={size * 0.55} height={size * 0.55} fill="none">
        <motion.path
          d="M5 13l4 4L19 7"
          stroke="#0a0a0a"
          strokeWidth={3}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={false}
          animate={{ pathLength: checked ? 1 : 0, opacity: checked ? 1 : 0 }}
          transition={{ duration: 0.2, ease: 'easeOut', delay: checked ? 0.05 : 0 }}
        />
      </svg>
    </motion.button>
  )
}
