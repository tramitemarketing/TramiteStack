import { createBrowserClient } from '@supabase/ssr'

// Client Supabase per i Client Component (browser).
// Schema dedicato `tstack` dentro il progetto condiviso "bussola".
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'tstack' } },
  )
}
