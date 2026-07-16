import { useState, useEffect } from 'react'
import { Bell, BellRing, BellOff } from 'lucide-react'
import { isPushSupported, getExistingSubscription, enablePush, disablePush } from './api'

type PushState = 'unsupported' | 'off' | 'on' | 'busy'

// Per-device push toggle. Full row in the sidebar footer; compact icon-only
// variant for the mobile Command Center header.
export function NotificationToggle({ compact = false }: { compact?: boolean }) {
  const [state, setState] = useState<PushState>('busy')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    if (!isPushSupported()) {
      setState('unsupported')
      return
    }
    getExistingSubscription()
      .then((sub) => !cancelled && setState(sub ? 'on' : 'off'))
      .catch(() => !cancelled && setState('off'))
    return () => {
      cancelled = true
    }
  }, [])

  async function toggle() {
    if (state !== 'on' && state !== 'off') return
    const was = state
    setState('busy')
    setError(null)
    try {
      if (was === 'off') {
        await enablePush()
        setState('on')
      } else {
        await disablePush()
        setState('off')
      }
    } catch (e) {
      setError((e as Error).message)
      setState(was)
    }
  }

  if (state === 'unsupported') return null

  const icon =
    state === 'on' ? <BellRing size={16} className="text-green-400" /> : state === 'busy' ? <Bell size={16} /> : <BellOff size={16} />

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        aria-label={state === 'on' ? 'Disable notifications' : 'Enable notifications'}
        title={error ?? (state === 'on' ? 'Notifications on' : 'Enable notifications')}
        className="rounded-lg p-2 text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-300"
      >
        {icon}
      </button>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={toggle}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-neutral-300"
      >
        {icon}
        {state === 'busy' ? 'Working…' : state === 'on' ? 'Notifications on' : 'Notifications off'}
      </button>
      {error && <p className="px-3 pb-1 text-[11px] leading-snug text-red-400">{error}</p>}
    </div>
  )
}
