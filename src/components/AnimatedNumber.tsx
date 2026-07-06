import { useEffect } from 'react'
import { motion, useMotionValue, useTransform, animate } from 'motion/react'

// Counts up to `value` when it mounts or changes. Used for stats (completion %,
// streaks, averages) so numbers feel alive rather than static.
export function AnimatedNumber({
  value,
  format = (n) => Math.round(n).toString(),
  duration = 0.7,
}: {
  value: number
  format?: (n: number) => string
  duration?: number
}) {
  const mv = useMotionValue(0)
  const text = useTransform(mv, (v) => format(v))

  useEffect(() => {
    const controls = animate(mv, value, { duration, ease: [0.16, 1, 0.3, 1] })
    return () => controls.stop()
  }, [value, duration, mv])

  return <motion.span>{text}</motion.span>
}
