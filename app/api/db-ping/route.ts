import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Ping leggero al database: una query minima per misurare la reattività reale.
export async function GET() {
  const supabase = await createClient()
  const { error } = await supabase.from('profiles').select('id', { head: true, count: 'exact' }).limit(1)
  if (error) {
    return NextResponse.json({ ok: false }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
  return NextResponse.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
}
