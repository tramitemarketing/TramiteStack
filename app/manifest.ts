import type { MetadataRoute } from 'next'

// Manifest PWA: rende T-Stack installabile sul telefono.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'T-Stack — TramiteMarketing',
    short_name: 'T-Stack',
    description: 'Gestione lavoro, task, calendario e bilancio',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#f8fafc',
    theme_color: '#4f46e5',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
