'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

type Level = 'good' | 'medium' | 'slow' | 'offline' | 'unknown'

const META: Record<Level, { color: string; bars: number; label: string }> = {
  good: { color: '#1F8A5B', bars: 3, label: 'Connessione buona' },
  medium: { color: '#E5A93A', bars: 2, label: 'Connessione media' },
  slow: { color: '#D8553F', bars: 1, label: 'Connessione lenta' },
  offline: { color: '#9CA5B3', bars: 0, label: 'Offline' },
  unknown: { color: '#C4CBD6', bars: 0, label: 'Verifica…' },
}

export function DbStatus() {
  const [level, setLevel] = useState<Level>('unknown')
  const [ms, setMs] = useState<number | null>(null)
  const [show, setShow] = useState(false)

  const measure = useCallback(async () => {
    const t0 = performance.now()
    try {
      const r = await fetch('/api/db-ping', { cache: 'no-store' })
      if (!r.ok) throw new Error('bad')
      const dt = Math.round(performance.now() - t0)
      setMs(dt)
      setLevel(dt < 300 ? 'good' : dt < 800 ? 'medium' : 'slow')
    } catch {
      setMs(null)
      setLevel('offline')
    }
  }, [])

  useEffect(() => {
    // Ping iniziale + periodico (lo stato si aggiorna dopo l'await, non in modo sincrono).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void measure()
    const id = setInterval(() => void measure(), 20000)
    const onVis = () => { if (document.visibilityState === 'visible') void measure() }
    const onOffline = () => setLevel('offline')
    document.addEventListener('visibilitychange', onVis)
    window.addEventListener('online', () => void measure())
    window.addEventListener('offline', onOffline)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      window.removeEventListener('offline', onOffline)
    }
  }, [measure])

  const meta = META[level]

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="press flex h-8 w-9 items-center justify-center rounded-full bg-white ring-1 ring-[#E0E4EB]"
        title={meta.label}
        aria-label={meta.label}
      >
        {/* Barre tipo wifi/segnale (dimensione fissa) */}
        <span className="flex items-end gap-[2px]" style={{ height: 14 }}>
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className={cn('w-[3px] rounded-[1px] transition-colors')}
              style={{ height: 5 + i * 4, backgroundColor: i < meta.bars ? meta.color : '#E0E4EB' }}
            />
          ))}
        </span>
      </button>
      {/* Tooltip "fantasma": in overlay, non occupa spazio nel layout */}
      {show && (
        <span className="pointer-events-none absolute right-0 top-full z-50 mt-1.5 whitespace-nowrap rounded-md px-2 py-1 text-[10px] font-bold text-white shadow-lg" style={{ backgroundColor: '#0A2E4D' }}>
          {level === 'offline' ? 'Offline' : `${meta.label}${ms != null ? ` · ${ms} ms` : ''}`}
        </span>
      )}
    </div>
  )
}
