import { type NextRequest } from 'next/server'
import { updateSession } from '@/lib/supabase/proxy'

// Proxy (ex Middleware in Next < 16): rinfresca la sessione Supabase
// e protegge le rotte private.
export async function proxy(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Tutte le rotte tranne asset statici e immagini
    '/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
