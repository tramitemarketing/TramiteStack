'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/push'
import type { ProjectStatus, TaskStatus, TxType } from '@/types/database'

// ---- Notifiche push (Web Push) ----
export async function savePushSubscription(sub: { endpoint: string; p256dh: string; auth: string }) {
  const supabase = await createClient()
  const uid = await currentUserId()
  if (!uid || !sub.endpoint) return
  await supabase
    .from('push_subscriptions')
    .upsert({ user_id: uid, endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, { onConflict: 'endpoint' })
}

export async function removePushSubscription(endpoint: string) {
  const supabase = await createClient()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}

// Crea notifiche + push per le persone menzionate in un commento.
export async function notifyTaskMention(taskId: string, userIds: string[], body: string) {
  const supabase = await createClient()
  const actor = await currentUserId()
  const targets = [...new Set(userIds)].filter((u) => u && u !== actor)
  await Promise.all(
    targets.map(async (u) => {
      await supabase.rpc('create_notification', {
        p_user_id: u,
        p_type: 'menzione',
        p_title: 'Ti hanno menzionato in un commento',
        p_body: body.slice(0, 120),
        p_entity_type: 'task',
        p_entity_id: taskId,
      })
      await sendPushToUser(u, { title: 'Ti hanno menzionato', body: body.slice(0, 120), url: '/tasks', tag: 'mention-' + taskId })
    }),
  )
}

async function currentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

function clampPriority(v: unknown): number {
  const n = Math.round(Number(v) || 3)
  return Math.min(5, Math.max(1, n))
}

// Ritorno uniforme delle mutation: il client distingue successo/errore.
export type ActionResult = { ok: true } | { ok: false; error: string }
const ok: ActionResult = { ok: true }
const fail = (error: string): ActionResult => ({ ok: false, error })

// Parsing importo robusto: accetta sia "12,50" (IT) sia "12.50".
function parseAmount(v: unknown): number {
  const raw = String(v ?? '').trim().replace(/\s/g, '').replace(/\./g, '').replace(',', '.')
  // Se l'utente usa il punto come decimale (es. "12.50") il replace sopra lo
  // toglierebbe: gestiamo entrambi i casi provando prima il valore grezzo.
  const direct = Number(String(v ?? '').trim().replace(',', '.'))
  const n = Number.isFinite(direct) && direct > 0 ? direct : Number(raw)
  return Number.isFinite(n) ? n : NaN
}

// ---- Progetti ----
export async function createProject(_prev: ActionResult | undefined, formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return fail('Inserisci il titolo del progetto.')
  const { data, error } = await supabase
    .from('projects')
    .insert({
      name,
      description: String(formData.get('description') ?? '') || null,
      status: String(formData.get('status') ?? 'attivo') as ProjectStatus,
      priority_level: clampPriority(formData.get('priority_level')),
      color: String(formData.get('color') ?? '') || null,
      due_date: String(formData.get('due_date') ?? '') || null,
    })
    .select('id')
    .single()
  if (error) return fail('Creazione del progetto non riuscita. Riprova.')
  revalidatePath('/projects')
  redirect(data?.id ? `/projects/${data.id}` : '/projects')
}

export async function setProjectStatus(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))
  await supabase
    .from('projects')
    .update({ status: String(formData.get('status')) as ProjectStatus })
    .eq('id', id)
  revalidatePath(`/projects/${id}`)
  revalidatePath('/projects')
}

export async function deleteProject(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('projects').delete().eq('id', String(formData.get('id')))
  revalidatePath('/projects')
  revalidatePath('/calendar')
  redirect('/projects')
}

// Modifica completa di un progetto
export async function updateProject(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const id = String(formData.get('id'))
  const name = String(formData.get('name') ?? '').trim()
  if (!id) return fail('Progetto non trovato.')
  if (!name) return fail('Inserisci il titolo del progetto.')
  const { error } = await supabase
    .from('projects')
    .update({
      name,
      description: String(formData.get('description') ?? '') || null,
      status: String(formData.get('status') ?? 'attivo') as ProjectStatus,
      priority_level: clampPriority(formData.get('priority_level')),
      color: String(formData.get('color') ?? '') || null,
      due_date: String(formData.get('due_date') ?? '') || null,
    })
    .eq('id', id)
  if (error) return fail('Salvataggio non riuscito. Riprova.')
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath('/calendar')
  return ok
}

// ---- Task ----
export async function createTask(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const projectId = String(formData.get('project_id'))
  const title = String(formData.get('title') ?? '').trim()
  if (!title) return fail('Inserisci il titolo del task.')
  if (!projectId) return fail('Seleziona un progetto.')
  const assignees = formData.getAll('assignee_ids').map(String).filter(Boolean)
  const { data: created, error } = await supabase
    .from('tasks')
    .insert({
      project_id: projectId,
      title,
      description: String(formData.get('description') ?? '') || null,
      priority_level: clampPriority(formData.get('priority_level')),
      assignee_ids: assignees,
      due_date: String(formData.get('due_date') ?? '') || null,
    })
    .select('id')
    .single()
  if (error) return fail('Creazione del task non riuscita. Riprova.')

  // Notifica a ogni assegnatario (escluso chi crea)
  const actor = await currentUserId()
  if (created?.id) {
    await Promise.all(
      assignees
        .filter((a) => a !== actor)
        .map(async (a) => {
          await supabase.rpc('create_notification', {
            p_user_id: a,
            p_type: 'task_assegnata',
            p_title: 'Nuova task assegnata',
            p_body: title,
            p_entity_type: 'task',
            p_entity_id: created.id,
          })
          await sendPushToUser(a, { title: 'Nuova task assegnata', body: title, url: '/tasks', tag: 'task-' + created.id })
        }),
    )
  }

  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/tasks')
  revalidatePath('/calendar')
  return ok
}

// Spostamento drag&drop: nuovo stato + posizione nella colonna
export async function moveTask(id: string, status: TaskStatus, position: number) {
  const supabase = await createClient()
  await supabase.from('tasks').update({ status, position }).eq('id', id)
  revalidatePath('/tasks')
}

// Riordino/spostamento drag&drop: aggiorna stato + posizione di più task.
// Ritorna esito così la board può fare rollback ottimistico in caso di errore.
export async function reorderTasks(items: { id: string; status: TaskStatus; position: number }[]): Promise<ActionResult> {
  if (!items.length) return ok
  const supabase = await createClient()
  const results = await Promise.all(
    items.map((it) => supabase.from('tasks').update({ status: it.status, position: it.position }).eq('id', it.id)),
  )
  const failed = results.some((r) => r.error)
  revalidatePath('/tasks')
  revalidatePath('/calendar')
  return failed ? fail('Spostamento non salvato. Riprova.') : ok
}

// Cambio stato di una singola task (box nei Progetti)
export async function changeTaskStatus(taskId: string, status: TaskStatus, projectId?: string) {
  const supabase = await createClient()
  await supabase.from('tasks').update({ status }).eq('id', taskId)
  revalidatePath('/tasks')
  revalidatePath('/calendar')
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

// Presa in carico: assegna la task all'utente corrente
export async function claimTask(formData: FormData) {
  const supabase = await createClient()
  const uid = await currentUserId()
  const id = String(formData.get('id'))
  if (!uid || !id) return
  await supabase.from('tasks').update({ assignee_id: uid }).eq('id', id)
  revalidatePath('/tasks')
  const projectId = String(formData.get('project_id') ?? '')
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

// Lascia la task (rimuove l'assegnatario)
export async function releaseTask(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))
  if (!id) return
  await supabase.from('tasks').update({ assignee_id: null }).eq('id', id)
  revalidatePath('/tasks')
  const projectId = String(formData.get('project_id') ?? '')
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

export async function deleteTask(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))
  await supabase.from('tasks').delete().eq('id', id)
  revalidatePath('/tasks')
  revalidatePath('/calendar')
  const projectId = String(formData.get('project_id') ?? '')
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

// Modifica completa di una task
export async function updateTask(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const id = String(formData.get('id'))
  const title = String(formData.get('title') ?? '').trim()
  if (!id) return fail('Task non trovato.')
  if (!title) return fail('Inserisci il titolo del task.')
  const assignees = formData.getAll('assignee_ids').map(String).filter(Boolean)

  // Assegnatari precedenti (per notificare solo i nuovi)
  const { data: prev } = await supabase.from('tasks').select('assignee_ids').eq('id', id).maybeSingle()
  const prevSet = new Set((prev as { assignee_ids: string[] | null } | null)?.assignee_ids ?? [])

  const { error } = await supabase
    .from('tasks')
    .update({
      title,
      description: String(formData.get('description') ?? '') || null,
      priority_level: clampPriority(formData.get('priority_level')),
      due_date: String(formData.get('due_date') ?? '') || null,
      assignee_ids: assignees,
    })
    .eq('id', id)
  if (error) return fail('Salvataggio non riuscito. Riprova.')

  const actor = await currentUserId()
  await Promise.all(
    assignees
      .filter((a) => !prevSet.has(a) && a !== actor)
      .map(async (a) => {
        await supabase.rpc('create_notification', {
          p_user_id: a,
          p_type: 'task_assegnata',
          p_title: 'Task assegnata a te',
          p_body: title,
          p_entity_type: 'task',
          p_entity_id: id,
        })
        await sendPushToUser(a, { title: 'Task assegnata a te', body: title, url: '/tasks', tag: 'task-' + id })
      }),
  )

  revalidatePath('/tasks')
  revalidatePath('/calendar')
  const projectId = String(formData.get('project_id') ?? '')
  if (projectId) revalidatePath(`/projects/${projectId}`)
  return ok
}

// ---- Transazioni (bilancio personale) ----
export async function createTransaction(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const uid = await currentUserId()
  const type = String(formData.get('type') ?? 'entrata') as TxType
  const amount = parseAmount(formData.get('amount'))
  const ownerId = String(formData.get('owner_id') ?? '') || uid
  if (!Number.isFinite(amount) || amount <= 0) return fail('Inserisci un importo valido maggiore di zero.')
  if (!ownerId) return fail('Seleziona il dipendente.')
  const description = String(formData.get('description') ?? '') || null
  const { data: created, error } = await supabase
    .from('transactions')
    .insert({
      type,
      amount,
      owner_id: ownerId,
      description,
      category: String(formData.get('category') ?? '') || null,
      project_id: String(formData.get('project_id') ?? '') || null,
      occurred_on: String(formData.get('occurred_on') ?? '') || new Date().toISOString().slice(0, 10),
      created_by: uid,
    })
    .select('id')
    .single()
  if (error) return fail('Registrazione del movimento non riuscita. Riprova.')

  // Notifica al titolare del movimento (se registrato da un altro)
  if (ownerId && ownerId !== uid && created?.id) {
    const segno = type === 'entrata' ? '+' : '−'
    const text = `${segno} € ${amount} ${description ? '· ' + description : ''}`.trim()
    await supabase.rpc('create_notification', {
      p_user_id: ownerId,
      p_type: 'movimento',
      p_title: 'Nuovo movimento sul tuo bilancio',
      p_body: text,
      p_entity_type: 'transaction',
      p_entity_id: created.id,
    })
    await sendPushToUser(ownerId, { title: 'Nuovo movimento sul tuo bilancio', body: text, url: '/budget', tag: 'tx-' + created.id })
  }

  revalidatePath('/budget')
  revalidatePath('/dashboard')
  return ok
}

export async function deleteTransaction(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('transactions').delete().eq('id', String(formData.get('id')))
  revalidatePath('/budget')
  revalidatePath('/dashboard')
}

// ---- Eventi calendario ----
export async function createEvent(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient()
  const uid = await currentUserId()
  const title = String(formData.get('title') ?? '').trim()
  const startsAt = String(formData.get('starts_at') ?? '')
  if (!title) return fail('Inserisci il titolo dell’evento.')
  if (!startsAt) return fail('Inserisci data e ora.')
  const when = new Date(startsAt)
  if (Number.isNaN(when.getTime())) return fail('Data e ora non valide.')
  const { error } = await supabase.from('calendar_events').insert({
    title,
    description: String(formData.get('description') ?? '') || null,
    starts_at: when.toISOString(),
    all_day: formData.get('all_day') === 'on',
    project_id: String(formData.get('project_id') ?? '') || null,
    created_by: uid,
  })
  if (error) return fail('Creazione dell’evento non riuscita. Riprova.')
  revalidatePath('/calendar')
  return ok
}

export async function deleteEvent(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('calendar_events').delete().eq('id', String(formData.get('id')))
  revalidatePath('/calendar')
}

// ---- Impostazioni admin: codice di registrazione ----
export async function updateRegistrationCode(formData: FormData) {
  const supabase = await createClient()
  const code = String(formData.get('registration_code') ?? '').trim()
  if (!code) return
  await supabase.from('app_settings').update({ registration_code: code, updated_at: new Date().toISOString() }).eq('id', true)
  revalidatePath('/settings')
}
