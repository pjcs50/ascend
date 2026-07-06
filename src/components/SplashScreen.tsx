import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'motion/react'

// Startup scene: the cursive "ascend" wordmark focuses in, holds a beat, then the
// whole overlay fades away to reveal the app beneath. Shown once per app launch.
// The overlay bg matches the app bg so the reveal feels seamless.
export function SplashScreen() {
  const [show, setShow] = useState(true)

  useEffect(() => {
    const t = setTimeout(() => setShow(false), 1900)
    return () => clearTimeout(t)
  }, [])

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="splash"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-neutral-950"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8, ease: 'easeInOut' }}
        >
          <motion.span
            className="font-logo select-none text-neutral-100"
            style={{ fontSize: 'clamp(3.5rem, 13vw, 6rem)', lineHeight: 1 }}
            initial={{ opacity: 0, y: 14, filter: 'blur(7px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 1.06, filter: 'blur(3px)' }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            ascend
          </motion.span>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
