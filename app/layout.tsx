import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'T-Stack',
  description: 'Gestione lavoro, task, calendario e bilancio di TramiteMarketing',
  applicationName: 'T-Stack',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'T-Stack',
  },
}

export const viewport: Viewport = {
  themeColor: '#0A2E4D',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ background: 'var(--background)', color: 'var(--foreground)' }}>
        {children}
      </body>
    </html>
  )
}
