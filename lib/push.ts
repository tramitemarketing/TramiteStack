import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'
import { VAPID_PUBLIC_KEY } from '@/lib/push-public'

const PRIVATE = process.env.VAPID_PRIVATE_KEY
const SUBJECT = process.env.VAPID_SUBJECT || 'mailto:tramitemarketing.it@gmail.com'

export type PushPayload = { title: string; body?: string; url?: string; tag?: string }

// Invia una notifica push a tutte le iscrizioni di un utente.
// No-op se mancano le chiavi/credenziali (build e runtime restano sicuri).
export async function sendPushToUser(userId: string, payload: PushPayload) {
  if (!PRIVATE) return
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return

  webpush.setVapidDetails(SUBJECT, VAPID_PUBLIC_KEY, PRIVATE)
  const admin = createClient(url, serviceKey, { db: { schema: 'tstack' } })
  const { data: subs } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')
    .eq('user_id', userId)

  await Promise.all(
    ((subs as { id: string; endpoint: string; p256dh: string; auth: string }[] | null) ?? []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          JSON.stringify(payload),
        )
      } catch (err) {
        const code = (err as { statusCode?: number })?.statusCode
        // Iscrizione scaduta/non valida → rimuovi.
        if (code === 404 || code === 410) {
          await admin.from('push_subscriptions').delete().eq('id', s.id)
        }
      }
    }),
  )
}
