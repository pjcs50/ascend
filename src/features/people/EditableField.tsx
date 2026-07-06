import { useState, useEffect } from 'react'

// Inline-editable text. Local state seeded from `value`, committed on blur. The
// sync effect is keyed narrowly on `value` so it can't stomp active typing
// (the store only pushes a new `value` after our own save returns).
export function EditableField({
  label,
  value,
  placeholder,
  multiline = false,
  onSave,
}: {
  label?: string
  value: string | null
  placeholder?: string
  multiline?: boolean
  onSave: (v: string | null) => void
}) {
  const [text, setText] = useState(value ?? '')
  useEffect(() => setText(value ?? ''), [value])

  function commit() {
    const next = text.trim() ? text : null
    if ((next ?? '') !== (value ?? '')) onSave(next)
  }

  const cls =
    'mt-1 w-full resize-none rounded-lg bg-neutral-900/60 px-3 py-2 text-sm text-neutral-200 outline-none ring-1 ring-transparent transition placeholder:text-neutral-600 focus:ring-neutral-700'

  return (
    <div>
      {label && <label className="text-[11px] uppercase tracking-wide text-neutral-500">{label}</label>}
      {multiline ? (
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          placeholder={placeholder}
          rows={2}
          className={cls}
        />
      ) : (
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={commit}
          placeholder={placeholder}
          className={cls}
        />
      )}
    </div>
  )
}
