// Gestione centralizzata dell'installazione PWA.
// L'evento `beforeinstallprompt` arriva una sola volta all'avvio: lo catturiamo
// qui e lo rendiamo disponibile sia al banner sia al bottone in Impostazioni.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let deferred: BeforeInstallPromptEvent | null = null
let installed = false
const listeners = new Set<() => void>()
let initialized = false

function emit() {
  listeners.forEach((l) => l())
}

// Da chiamare una volta (da un componente client sempre montato).
export function initInstall() {
  if (initialized || typeof window === 'undefined') return
  initialized = true
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault()
    deferred = e as BeforeInstallPromptEvent
    emit()
  })
  window.addEventListener('appinstalled', () => {
    deferred = null
    installed = true
    emit()
  })
}

export function subscribeInstall(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function canInstall() {
  return deferred !== null
}

export function wasInstalled() {
  return installed
}

export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false
  await deferred.prompt()
  const res = await deferred.userChoice
  deferred = null
  emit()
  return res.outcome === 'accepted'
}

export function isStandalone() {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

export function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase())
}
