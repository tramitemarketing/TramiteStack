import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Endpoint cron: genera promemoria per i task in scadenza entro 2 giorni
// che hanno un assegnatario e non hanno già una notifica.
// Va schedulato (es. Vercel Cron) e protetto da CRON_SECRET.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET
  const auth = request.headers.get('authorization')
  if (secret && auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    return NextResponse.json({ error: 'missing config' }, { status: 500 })
  }

  const supabase = createClient(url, serviceKey, { db: { schema: 'tstack' } })
  const today = new Date()
  const limit = new Date(today.getTime() + 2 * 86400000).toISOString().slice(0, 10)

  const { data: tasks } = await supabase
    .from('tasks')
    .select('id, title, due_date, assignee_id')
    .neq('status', 'completato')
    .not('assignee_id', 'is', null)
    .lte('due_date', limit)

  let created = 0
  for (const t of tasks ?? []) {
    // Evita duplicati per lo stesso task
    const { data: existing } = await supabase
      .from('notifications')
      .select('id')
      .eq('entity_type', 'task')
      .eq('entity_id', t.id)
      .is('read_at', null)
      .maybeSingle()
    if (existing) continue

    await supabase.from('notifications').insert({
      user_id: t.assignee_id,
      type: 'promemoria',
      title: 'Task in scadenza',
      body: `"${t.title}" scade il ${t.due_date}`,
      entity_type: 'task',
      entity_id: t.id,
    })
    created++
  }

  return NextResponse.json({ ok: true, created })
}
