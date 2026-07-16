import { supabase } from '../../lib/supabase'

// Web Push subscribe/unsubscribe for THIS device. The server function
// (api/notify.ts) reads push_subscriptions and sends through web-push.

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = window.atob(b64)
  // Explicit ArrayBuffer (not ArrayBufferLike) so it satisfies BufferSource.
  const out = new Uint8Array(new ArrayBuffer(raw.length))
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function isPushSupported(): boolean {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null
  const reg = await navigator.serviceWorker.ready
  return reg.pushManager.getSubscription()
}

export async function enablePush(): Promise<void> {
  if (!isPushSupported()) throw new Error('This browser does not support push notifications.')
  const key = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined
  if (!key) throw new Error('Push is not configured (missing VAPID public key).')

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notifications are blocked — allow them in settings, then retry.')
  }

  const reg = await navigator.serviceWorker.ready
  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  })
  const json = sub.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: sub.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
    { onConflict: 'endpoint' },
  )
  if (error) throw error
}

export async function disablePush(): Promise<void> {
  const sub = await getExistingSubscription()
  if (!sub) return
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
  if (error) throw error
  await sub.unsubscribe()
}
