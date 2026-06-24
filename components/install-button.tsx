'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui'
import { LogoMark } from '@/components/logo'
import { initInstall, subscribeInstall, canInstall, promptInstall, isIOS, isStandalone } from '@/lib/pwa-install'

export function InstallButton() {
  const [, force] = useState(0)
  const [standalone, setStandalone] = useState(false)
  const [ios, setIos] = useState(false)

  useEffect(() => {
    initInstall()
    /* eslint-disable react-hooks/set-state-in-effect */
    setStandalone(isStandalone())
    setIos(isIOS())
    /* eslint-enable react-hooks/set-state-in-effect */
    return subscribeInstall(() => force((n) => n + 1))
  }, [])

  const can = canInstall()

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-3">
        <LogoMark size={40} boxed />
        <div>
          <h2 className="font-display font-bold text-[#1A1F2B]">Installa l&apos;app</h2>
          <p className="text-xs font-medium text-[#6B7280]">Apri T-Stack come un&apos;app, a tutto schermo.</p>
        </div>
      </div>

      {standalone ? (
        <p className="rounded-[10px] bg-[#E6F3EC] px-3 py-2 text-sm font-bold text-ok">✓ App già installata</p>
      ) : ios ? (
        <p className="text-sm font-medium text-[#5A6473]">
          Su iPhone/iPad: tocca <b>Condividi ⬆️</b> e poi <b>“Aggiungi a Home”</b>.
        </p>
      ) : can ? (
        <button
          onClick={() => void promptInstall()}
          className="press w-full rounded-[10px] px-4 py-2.5 text-sm font-bold text-white"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          Installa l&apos;app
        </button>
      ) : (
        <p className="text-sm font-medium text-[#5A6473]">
          Apri il <b>menu del browser</b> e scegli <b>“Installa app”</b> (o “Aggiungi a schermata Home”).
        </p>
      )}
    </Card>
  )
}
