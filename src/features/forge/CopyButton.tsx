import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyButton({
  text,
  label = 'Copy',
  className = '',
}: {
  text: string
  label?: string
  className?: string
}) {
  const [copied, setCopied] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs transition-colors ${className}`}
    >
      {copied ? <Check size={13} /> : <Copy size={13} />}
      {copied ? 'Copied' : label}
    </button>
  )
}
