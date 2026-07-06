import { useState, type FormEvent } from 'react'
import { motion } from 'motion/react'
import { usePeopleStore } from './peopleStore'

// Quick-add a person. Just the essentials — the rest (qualities, lessons, traits)
// is filled in by expanding the card.
export function PersonFormDialog({ onClose }: { onClose: () => void }) {
  const addPerson = usePeopleStore((s) => s.addPerson)
  const [name, setName] = useState('')
  const [relationship, setRelationship] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setBusy(true)
    setError(null)
    try {
      await addPerson({ name: name.trim(), relationship: relationship.trim() || null })
      onClose()
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  const field =
    'w-full rounded-lg border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm outline-none placeholder:text-neutral-600 focus:border-neutral-500'

  return (
    <motion.div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: 8 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="w-full max-w-sm space-y-4 rounded-3xl border border-neutral-800 bg-neutral-950 p-5"
      >
        <h2 className="text-lg font-semibold">Add person</h2>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">Name</label>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Elena"
            className={field}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-neutral-500">Relationship (optional)</label>
          <input
            value={relationship}
            onChange={(e) => setRelationship(e.target.value)}
            placeholder="Mentor, friend, colleague…"
            className={field}
          />
        </div>
        {error && <p className="text-sm text-red-400">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-3 py-2 text-sm text-neutral-400 hover:text-neutral-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={busy || !name.trim()}
            className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-medium text-neutral-950 hover:bg-white disabled:opacity-50"
          >
            {busy ? 'Adding…' : 'Add'}
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}
