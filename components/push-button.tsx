'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui'
import { IconBell } from '@/components/icons'
import { VAPID_PUBLIC_KEY } from '@/lib/push-public'
import { savePushSubscription, removePushSubscription } from '@/app/(app)/actions'

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

export function PushButton() {
  const [supported, setSupported] = useState(true)
  const [enabled, setEnabled] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  useEffect(() => {
    const ok = typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(ok)
    if (!ok) return
    navigator.serviceWorker
      .register('/sw.js')
      .then(async (reg) => {
        const sub = await reg.pushManager.getSubscription()
        setEnabled(!!sub && Notification.permission === 'granted')
      })
      .catch(() => {})
  }, [])

  async function enable() {
    setBusy(true)
    setErr(null)
    try {
      const reg = await navigator.serviceWorker.register('/sw.js')
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') {
        setErr('Permesso negato dal browser.')
        return
      }
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })
      const json = sub.toJSON()
      await savePushSubscription({ endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' })
      setEnabled(true)
    } catch {
      setErr('Attivazione non riuscita.')
    } finally {
      setBusy(false)
    }
  }

  async function disable() {
    setBusy(true)
    try {
      const reg = await navigator.serviceWorker.getRegistration()
      const sub = await reg?.pushManager.getSubscription()
      if (sub) {
        await removePushSubscription(sub.endpoint)
        await sub.unsubscribe()
      }
      setEnabled(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-brand-50 text-brand"><IconBell size={20} /></span>
        <div>
          <h2 className="font-display font-bold text-[#1A1F2B]">Notifiche push</h2>
          <p className="text-xs font-medium text-[#6B7280]">Ricevile anche con l&apos;app chiusa.</p>
        </div>
      </div>
      {!supported ? (
        <p className="text-sm font-medium text-[#5A6473]">
          Questo dispositivo non supporta le push. Su iPhone installa prima l&apos;app (Aggiungi a Home).
        </p>
      ) : enabled ? (
        <div className="flex items-center justify-between gap-2">
          <p className="rounded-[10px] bg-[#E6F3EC] px-3 py-2 text-sm font-bold text-ok">✓ Attive su questo dispositivo</p>
          <button onClick={disable} disabled={busy} className="press text-sm font-semibold text-[#6B7280]">Disattiva</button>
        </div>
      ) : (
        <button
          onClick={enable}
          disabled={busy}
          className="press w-full rounded-[10px] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          {busy ? 'Attivazione…' : 'Attiva notifiche push'}
        </button>
      )}
      {err && <p className="text-sm text-danger">{err}</p>}
    </Card>
  )
}
