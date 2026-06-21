'use client'

import { useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'

// Ordine delle sezioni della bottom-nav per lo swipe orizzontale.
const ORDER = ['/dashboard', '/tasks', '/calendar', '/budget', '/projects']

export function SwipeNav({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const start = useRef<{ x: number; y: number; skip: boolean } | null>(null)

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    // Salta se la gesture parte da un'area che gestisce lo swipe in proprio
    // (board task, griglia calendario) per non interferire.
    const skip = !!(e.target as HTMLElement).closest('[data-no-swipe]')
    start.current = { x: t.clientX, y: t.clientY, skip }
  }

  function onTouchEnd(e: React.TouchEvent) {
    const s = start.current
    start.current = null
    if (!s || s.skip) return
    const idx = ORDER.indexOf(pathname)
    if (idx < 0) return // pagine di dettaglio: nessuno swipe
    const t = e.changedTouches[0]
    const dx = t.clientX - s.x
    const dy = t.clientY - s.y
    if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return
    const next = dx < 0 ? idx + 1 : idx - 1
    if (next < 0 || next >= ORDER.length) return
    router.push(ORDER[next])
  }

  return (
    <div onTouchStart={onTouchStart} onTouchEnd={onTouchEnd} className="min-h-full">
      {children}
    </div>
  )
}
