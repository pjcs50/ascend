import { useState, type ReactNode } from 'react'
import { motion } from 'motion/react'
import { Sparkles, Trash2 } from 'lucide-react'
import { useForgeStore } from './forgeStore'
import { CopyButton } from './CopyButton'
import { buildTriagePrompt, parseTriageResponse } from './prompt'
import type { ForgeItem, ForgePrompt, ForgeStatus } from './types'

const STATUS_STYLE: Record<ForgeStatus, string> = {
  new: 'bg-blue-500/15 text-blue-300',
  triaged: 'bg-purple-500/15 text-purple-300',
  in_progress: 'bg-amber-500/15 text-amber-300',
  done: 'bg-green-500/15 text-green-300',
  archived: 'bg-neutral-700/40 text-neutral-400',
}
const STATUS_LABEL: Record<ForgeStatus, string> = {
  new: 'New',
  triaged: 'Triaged',
  in_progress: 'In progress',
  done: 'Done',
  archived: 'Archived',
}

export function ForgePage() {
  const items = useForgeStore((s) => s.items)
  const prompts = useForgeStore((s) => s.prompts)
  const loaded = useForgeStore((s) => s.loaded)
  const error = useForgeStore((s) => s.error)
  const capture = useForgeStore((s) => s.capture)

  const [text, setText] = useState('')
  const [showArchived, setShowArchived] = useState(false)

  async function handleCapture() {
    const t = text.trim()
    if (!t) return
    setText('')
    await capture(t)
  }

  const visible = items.filter((i) => (showArchived ? true : i.status !== 'archived'))
  const archivedCount = items.filter((i) => i.status === 'archived').length

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Sparkles size={20} className="text-purple-300" />
          The Forge
        </h1>
        <p className="text-sm text-neutral-500">
          Drop any thought. Turn it into a Claude battle-plan.
        </p>
      </div>

      {/* Capture box */}
      <div className="mb-6 rounded-2xl border border-neutral-800 bg-neutral-900/40 p-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              handleCapture()
            }
          }}
          rows={2}
          placeholder="An idea, a task, a worry, anything on your mind…"
          className="w-full resize-none bg-transparent px-2 py-1 text-sm text-neutral-100 outline-none placeholder:text-neutral-600"
        />
        <div className="mt-1 flex items-center justify-between px-1">
          <span className="text-[11px] text-neutral-600">⌘↵ to capture</span>
          <motion.button
            type="button"
            onClick={handleCapture}
            disabled={!text.trim()}
            whileTap={{ scale: 0.96 }}
            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-sm font-medium text-neutral-950 hover:bg-white disabled:opacity-40"
          >
            Capture
          </motion.button>
        </div>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-3 py-2 text-sm text-red-300">{error}</p>
      )}

      {loaded && visible.length === 0 && (
        <p className="py-12 text-center text-sm text-neutral-600">
          Your inbox is empty. Capture something above.
        </p>
      )}

      <div className="space-y-3">
        {visible.map((item) => (
          <ForgeCard key={item.id} item={item} prompts={prompts.filter((p) => p.forge_item_id === item.id)} />
        ))}
      </div>

      {archivedCount > 0 && (
        <button
          type="button"
          onClick={() => setShowArchived((v) => !v)}
          className="mt-5 text-xs text-neutral-600 hover:text-neutral-400"
        >
          {showArchived ? 'Hide' : `Show ${archivedCount}`} archived
        </button>
      )}
    </div>
  )
}

function ForgeCard({ item, prompts }: { item: ForgeItem; prompts: ForgePrompt[] }) {
  const applyTriage = useForgeStore((s) => s.applyTriage)
  const setStatus = useForgeStore((s) => s.setStatus)
  const remove = useForgeStore((s) => s.remove)

  const [response, setResponse] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [applying, setApplying] = useState(false)

  async function applyResponse() {
    const { result, error } = parseTriageResponse(response)
    if (!result) {
      setParseError(error)
      return
    }
    setParseError(null)
    setApplying(true)
    try {
      await applyTriage(item.id, result)
      setResponse('')
    } finally {
      setApplying(false)
    }
  }

  const triaged = item.status !== 'new'

  return (
    <div className="overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-900/40">
      <div className="flex items-start gap-3 p-4">
        <p className="flex-1 whitespace-pre-wrap text-sm text-neutral-100">{item.raw_text}</p>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] ${STATUS_STYLE[item.status]}`}>
          {STATUS_LABEL[item.status]}
        </span>
        <button type="button" onClick={() => remove(item.id)} className="shrink-0 text-neutral-600 hover:text-red-400">
          <Trash2 size={15} />
        </button>
      </div>

      {/* New → the copy-paste triage bridge */}
      {item.status === 'new' && (
        <div className="space-y-2 border-t border-neutral-800 bg-neutral-900/40 p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] uppercase tracking-wide text-neutral-500">Triage with Claude</span>
            <CopyButton
              text={buildTriagePrompt(item.raw_text)}
              label="Copy triage prompt"
              className="bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            />
          </div>
          <p className="text-xs text-neutral-600">
            Paste that into any Claude (chat, Code, Cowork), then paste its JSON reply back here.
          </p>
          <textarea
            value={response}
            onChange={(e) => setResponse(e.target.value)}
            rows={2}
            placeholder="Paste Claude's response…"
            className="w-full resize-none rounded-lg bg-neutral-900/60 p-2 text-xs text-neutral-200 outline-none ring-1 ring-transparent focus:ring-neutral-700"
          />
          {parseError && <p className="text-xs text-red-400">{parseError}</p>}
          <button
            type="button"
            onClick={applyResponse}
            disabled={!response.trim() || applying}
            className="rounded-lg bg-neutral-100 px-3 py-1.5 text-xs font-medium text-neutral-950 hover:bg-white disabled:opacity-40"
          >
            {applying ? 'Applying…' : 'Apply battle-plan'}
          </button>
        </div>
      )}

      {/* Triaged → the battle-plan */}
      {triaged && (
        <div className="space-y-3 border-t border-neutral-800 p-4">
          <div className="flex flex-wrap gap-2 text-[11px]">
            {item.ai_category && <Chip>{item.ai_category}</Chip>}
            {item.effort_estimate && <Chip>{item.effort_estimate}</Chip>}
            {item.ai_destination && <Chip>→ {item.ai_destination}</Chip>}
          </div>

          {item.recommended_surface && (
            <div>
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">Use</div>
              <div className="text-sm text-neutral-200">{item.recommended_surface}</div>
              {item.rationale && <div className="text-xs text-neutral-500">{item.rationale}</div>}
            </div>
          )}

          {item.next_action && (
            <div className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2.5">
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">Next action</div>
              <div className="text-sm text-neutral-200">{item.next_action}</div>
            </div>
          )}

          {prompts.length > 0 && (
            <div className="space-y-2">
              <div className="text-[11px] uppercase tracking-wide text-neutral-500">Prompts</div>
              {prompts.map((p, i) => (
                <div key={p.id} className="rounded-lg border border-neutral-800 bg-neutral-900/60 p-2.5">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-[11px] text-neutral-500">
                      {i + 1}. {p.surface || 'Claude'}
                    </span>
                    <CopyButton text={p.prompt_text} className="text-neutral-400 hover:text-neutral-100" />
                  </div>
                  <p className="whitespace-pre-wrap text-xs text-neutral-300">{p.prompt_text}</p>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap gap-2 pt-1">
            {item.status !== 'in_progress' && item.status !== 'done' && (
              <StatusBtn onClick={() => setStatus(item.id, 'in_progress')}>Start</StatusBtn>
            )}
            {item.status !== 'done' && <StatusBtn onClick={() => setStatus(item.id, 'done')}>Done</StatusBtn>}
            {item.status !== 'archived' && (
              <StatusBtn onClick={() => setStatus(item.id, 'archived')}>Archive</StatusBtn>
            )}
            <StatusBtn onClick={() => setStatus(item.id, 'new')}>Re-triage</StatusBtn>
          </div>
        </div>
      )}
    </div>
  )
}

function Chip({ children }: { children: ReactNode }) {
  return <span className="rounded-full bg-neutral-800 px-2 py-0.5 text-neutral-300">{children}</span>
}

function StatusBtn({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-lg border border-neutral-700 px-2.5 py-1 text-xs text-neutral-400 transition-colors hover:border-neutral-500 hover:text-neutral-200"
    >
      {children}
    </button>
  )
}
