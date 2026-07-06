import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Plus } from 'lucide-react'
import { usePeopleStore } from './peopleStore'
import { PersonCard } from './PersonCard'
import { PersonFormDialog } from './PersonFormDialog'

export function PeoplePage() {
  const people = usePeopleStore((s) => s.people)
  const loading = usePeopleStore((s) => s.loading)
  const loaded = usePeopleStore((s) => s.loaded)
  const error = usePeopleStore((s) => s.error)
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">People</h1>
          <p className="text-sm text-neutral-500">Learn from the people around you.</p>
        </div>
        <motion.button
          type="button"
          onClick={() => setDialogOpen(true)}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 500, damping: 25 }}
          className="flex items-center gap-1.5 rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-white"
        >
          <Plus size={16} />
          New
        </motion.button>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}
      {loading && !loaded && <p className="py-8 text-center text-sm text-neutral-500">Loading…</p>}

      {loaded && people.length === 0 && (
        <p className="py-16 text-center text-sm text-neutral-500">
          No one here yet. Add the people you want to learn from.
        </p>
      )}

      {loaded && people.length > 0 && (
        <div className="space-y-3">
          {people.map((p) => (
            <PersonCard key={p.id} person={p} />
          ))}
        </div>
      )}

      <AnimatePresence>
        {dialogOpen && <PersonFormDialog onClose={() => setDialogOpen(false)} />}
      </AnimatePresence>
    </div>
  )
}
