import confetti from 'canvas-confetti'

// Palette matched to the app's habit/priority colors — not rainbow-party.
const CELEBRATION_COLORS = ['#22c55e', '#3b82f6', '#a855f7', '#f59e0b', '#ec4899']

// A restrained, smooth burst from a specific element (the checkbox that was
// just ticked). Two small layered bursts read richer than one big one while
// staying far from the "confetti cannon" look. Respects reduced-motion.
export function celebrateAt(el: HTMLElement): void {
  const rect = el.getBoundingClientRect()
  const origin = {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  }
  confetti({
    particleCount: 26,
    spread: 70,
    startVelocity: 14,
    scalar: 0.7,
    ticks: 90,
    gravity: 0.9,
    origin,
    colors: CELEBRATION_COLORS,
    disableForReducedMotion: true,
  })
  confetti({
    particleCount: 12,
    spread: 110,
    startVelocity: 8,
    scalar: 0.5,
    ticks: 70,
    gravity: 0.8,
    origin,
    colors: CELEBRATION_COLORS,
    disableForReducedMotion: true,
  })
}
