import type { LifeArea } from './types'

// Radar visualization of this month's life-area ratings (1–10).
export function WheelOfLife({
  areas,
  ratingFor,
}: {
  areas: LifeArea[]
  ratingFor: (id: string) => number | null
}) {
  if (areas.length < 3) {
    return (
      <p className="py-8 text-center text-xs text-neutral-600">
        Add at least 3 life areas below to see your wheel.
      </p>
    )
  }

  const size = 300
  const c = size / 2
  const R = 100
  const n = areas.length
  const angle = (i: number) => ((-90 + (360 / n) * i) * Math.PI) / 180
  const pt = (i: number, r: number): [number, number] => [c + Math.cos(angle(i)) * r, c + Math.sin(angle(i)) * r]

  const dataPts = areas.map((a, i) => pt(i, ((ratingFor(a.id) ?? 0) / 10) * R))
  const polygon = dataPts.map((p) => p.join(',')).join(' ')
  const rings = [0.25, 0.5, 0.75, 1].map((f) => areas.map((_, i) => pt(i, f * R).join(',')).join(' '))

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="mx-auto w-full max-w-[280px]">
      {rings.map((r, i) => (
        <polygon key={i} points={r} fill="none" stroke="#262626" strokeWidth={1} />
      ))}
      {areas.map((_, i) => {
        const [x, y] = pt(i, R)
        return <line key={i} x1={c} y1={c} x2={x} y2={y} stroke="#262626" strokeWidth={1} />
      })}
      <polygon points={polygon} fill="rgba(168,85,247,0.22)" stroke="#a855f7" strokeWidth={2} strokeLinejoin="round" />
      {dataPts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3.5} fill="#a855f7" />
      ))}
      {areas.map((a, i) => {
        const [x, y] = pt(i, R + 20)
        return (
          <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" fontSize="10" fill="#a3a3a3">
            {a.name}
          </text>
        )
      })}
    </svg>
  )
}
