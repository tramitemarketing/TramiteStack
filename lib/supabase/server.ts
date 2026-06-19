import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Client Supabase per Server Component / Server Action / Route Handler.
// In Next 16 `cookies()` è asincrono.
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Schema dedicato `tstack` dentro il progetto condiviso "bussola".
      db: { schema: 'tstack' },
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Chiamato da un Server Component: ignorabile se il refresh
            // della sessione avviene nel proxy.
          }
        },
      },
    },
  )
}
