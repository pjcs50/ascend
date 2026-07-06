import { useState, useEffect } from 'react'
import { FileText, Plus, ChevronRight, Trash2, Search, X } from 'lucide-react'
import { useKbStore } from './kbStore'
import type { KbPage } from './types'

export function KbPageView() {
  const pages = useKbStore((s) => s.pages)
  const selectedId = useKbStore((s) => s.selectedId)
  const loaded = useKbStore((s) => s.loaded)
  const error = useKbStore((s) => s.error)
  const addPage = useKbStore((s) => s.addPage)
  const [query, setQuery] = useState('')

  const roots = pages.filter((p) => !p.parent_id)
  const selected = pages.find((p) => p.id === selectedId) ?? null

  const matches = query.trim()
    ? pages.filter(
        (p) =>
          p.title.toLowerCase().includes(query.toLowerCase()) ||
          (p.content ?? '').toLowerCase().includes(query.toLowerCase()),
      )
    : null

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row">
      {/* Tree pane */}
      <aside className="w-full shrink-0 md:w-64">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight">Knowledge</h1>
          <button
            type="button"
            onClick={() => addPage(null)}
            className="flex items-center gap-1 rounded-lg bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-950 hover:bg-white"
          >
            <Plus size={13} /> New
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2 rounded-lg border border-neutral-800 bg-neutral-900/40 px-2">
          <Search size={14} className="text-neutral-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="w-full bg-transparent py-1.5 text-sm text-neutral-200 outline-none placeholder:text-neutral-600"
          />
        </div>

        {error && <p className="mb-2 text-xs text-red-400">{error}</p>}

        {matches ? (
          <div className="space-y-0.5">
            {matches.map((p) => (
              <PageRow key={p.id} page={p} depth={0} searchMode />
            ))}
            {matches.length === 0 && <p className="px-2 text-xs text-neutral-600">No matches.</p>}
          </div>
        ) : (
          <div className="space-y-0.5">
            {roots.map((p) => (
              <TreeNode key={p.id} page={p} depth={0} />
            ))}
            {loaded && roots.length === 0 && (
              <p className="px-2 py-4 text-xs text-neutral-600">No pages yet. Create one.</p>
            )}
          </div>
        )}
      </aside>

      {/* Editor */}
      <main className="min-w-0 flex-1">
        {selected ? (
          <Editor key={selected.id} page={selected} />
        ) : (
          <div className="flex h-64 items-center justify-center text-sm text-neutral-600">
            Select or create a page.
          </div>
        )}
      </main>
    </div>
  )
}

function TreeNode({ page, depth }: { page: KbPage; depth: number }) {
  const pages = useKbStore((s) => s.pages)
  const [open, setOpen] = useState(true)
  const children = pages.filter((p) => p.parent_id === page.id)

  return (
    <div>
      <PageRow page={page} depth={depth} hasChildren={children.length > 0} open={open} onToggle={() => setOpen((o) => !o)} />
      {open && children.map((c) => <TreeNode key={c.id} page={c} depth={depth + 1} />)}
    </div>
  )
}

function PageRow({
  page,
  depth,
  hasChildren,
  open,
  onToggle,
  searchMode,
}: {
  page: KbPage
  depth: number
  hasChildren?: boolean
  open?: boolean
  onToggle?: () => void
  searchMode?: boolean
}) {
  const selectedId = useKbStore((s) => s.selectedId)
  const select = useKbStore((s) => s.select)
  const addPage = useKbStore((s) => s.addPage)
  const active = selectedId === page.id

  return (
    <div
      className={`group flex items-center gap-1 rounded-lg pr-1 text-sm ${
        active ? 'bg-neutral-800 text-neutral-100' : 'text-neutral-400 hover:bg-neutral-900'
      }`}
      style={{ paddingLeft: 4 + depth * 14 }}
    >
      {!searchMode && hasChildren ? (
        <button type="button" onClick={onToggle} className="p-0.5 text-neutral-500">
          <ChevronRight size={13} className={open ? 'rotate-90 transition-transform' : 'transition-transform'} />
        </button>
      ) : (
        <span className="w-[18px]" />
      )}
      <button
        type="button"
        onClick={() => select(page.id)}
        className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left"
      >
        <span className="shrink-0 text-xs">{page.icon || <FileText size={13} className="text-neutral-500" />}</span>
        <span className="truncate">{page.title || 'Untitled'}</span>
      </button>
      {!searchMode && (
        <button
          type="button"
          onClick={() => addPage(page.id)}
          className="p-0.5 text-neutral-600 opacity-0 hover:text-neutral-200 group-hover:opacity-100"
          aria-label="Add subpage"
        >
          <Plus size={13} />
        </button>
      )}
    </div>
  )
}

function Editor({ page }: { page: KbPage }) {
  const updatePage = useKbStore((s) => s.updatePage)
  const removePage = useKbStore((s) => s.removePage)
  const [title, setTitle] = useState(page.title)
  const [content, setContent] = useState(page.content ?? '')
  const [tagInput, setTagInput] = useState('')
  const [confirming, setConfirming] = useState(false)

  useEffect(() => setTitle(page.title), [page.title])
  useEffect(() => setContent(page.content ?? ''), [page.content])

  function commitTitle() {
    const t = title.trim() || 'Untitled'
    if (t !== page.title) updatePage(page.id, { title: t })
  }
  function commitContent() {
    if (content !== (page.content ?? '')) updatePage(page.id, { content: content || null })
  }
  function addTag() {
    const t = tagInput.trim().toLowerCase()
    setTagInput('')
    if (!t || page.tags.includes(t)) return
    updatePage(page.id, { tags: [...page.tags, t] })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <input
          value={page.icon ?? ''}
          onChange={(e) => updatePage(page.id, { icon: e.target.value || null })}
          placeholder="📄"
          maxLength={2}
          className="w-10 rounded-lg bg-neutral-900/60 px-2 py-1 text-center text-lg outline-none"
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          placeholder="Untitled"
          className="flex-1 bg-transparent text-2xl font-bold tracking-tight text-neutral-100 outline-none placeholder:text-neutral-700"
        />
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        {page.tags.map((t) => (
          <span key={t} className="flex items-center gap-1 rounded-full bg-neutral-800 px-2 py-0.5 text-xs text-neutral-300">
            #{t}
            <button type="button" onClick={() => updatePage(page.id, { tags: page.tags.filter((x) => x !== t) })} className="text-neutral-500 hover:text-red-400">
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
          onBlur={addTag}
          placeholder="add tag…"
          className="w-24 bg-transparent text-xs text-neutral-300 outline-none placeholder:text-neutral-600"
        />
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onBlur={commitContent}
        placeholder="Start writing… notes, links, quotes, book takeaways."
        className="min-h-[50vh] w-full resize-none bg-transparent text-sm leading-relaxed text-neutral-200 outline-none placeholder:text-neutral-600"
      />

      <div className="border-t border-neutral-800 pt-3">
        {confirming ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="text-red-300">Delete this page and all its subpages?</span>
            <button type="button" onClick={() => setConfirming(false)} className="text-neutral-400 hover:text-neutral-200">
              Cancel
            </button>
            <button type="button" onClick={() => removePage(page.id)} className="font-medium text-red-400 hover:text-red-300">
              Delete
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="flex items-center gap-1.5 text-xs text-neutral-600 hover:text-red-400"
          >
            <Trash2 size={13} /> Delete page
          </button>
        )}
      </div>
    </div>
  )
}
