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

// ---- Progetti ----
export async function createProject(formData: FormData) {
  const supabase = await createClient()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  const { data } = await supabase
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
  revalidatePath('/projects')
  if (data?.id) redirect(`/projects/${data.id}`)
  redirect('/projects')
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
export async function updateProject(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))
  const name = String(formData.get('name') ?? '').trim()
  if (!id || !name) return
  await supabase
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
  revalidatePath('/projects')
  revalidatePath(`/projects/${id}`)
  revalidatePath('/calendar')
}

// ---- Task ----
export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const projectId = String(formData.get('project_id'))
  const title = String(formData.get('title') ?? '').trim()
  if (!title || !projectId) return
  const assignees = formData.getAll('assignee_ids').map(String).filter(Boolean)
  const { data: created } = await supabase
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
}

// Spostamento drag&drop: nuovo stato + posizione nella colonna
export async function moveTask(id: string, status: TaskStatus, position: number) {
  const supabase = await createClient()
  await supabase.from('tasks').update({ status, position }).eq('id', id)
  revalidatePath('/tasks')
}

// Riordino/spostamento drag&drop: aggiorna stato + posizione di più task.
export async function reorderTasks(items: { id: string; status: TaskStatus; position: number }[]) {
  if (!items.length) return
  const supabase = await createClient()
  await Promise.all(
    items.map((it) => supabase.from('tasks').update({ status: it.status, position: it.position }).eq('id', it.id)),
  )
  revalidatePath('/tasks')
  revalidatePath('/calendar')
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
export async function updateTask(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))
  const title = String(formData.get('title') ?? '').trim()
  if (!id || !title) return
  const assignees = formData.getAll('assignee_ids').map(String).filter(Boolean)

  // Assegnatari precedenti (per notificare solo i nuovi)
  const { data: prev } = await supabase.from('tasks').select('assignee_ids').eq('id', id).maybeSingle()
  const prevSet = new Set((prev as { assignee_ids: string[] | null } | null)?.assignee_ids ?? [])

  await supabase
    .from('tasks')
    .update({
      title,
      description: String(formData.get('description') ?? '') || null,
      priority_level: clampPriority(formData.get('priority_level')),
      due_date: String(formData.get('due_date') ?? '') || null,
      assignee_ids: assignees,
    })
    .eq('id', id)

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
}

// ---- Transazioni (bilancio personale) ----
export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const uid = await currentUserId()
  const type = String(formData.get('type') ?? 'entrata') as TxType
  const amount = Number(formData.get('amount') ?? 0)
  const ownerId = String(formData.get('owner_id') ?? '') || uid
  if (!amount || amount <= 0 || !ownerId) return
  const description = String(formData.get('description') ?? '') || null
  const { data: created } = await supabase
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
}

export async function deleteTransaction(formData: FormData) {
  const supabase = await createClient()
  await supabase.from('transactions').delete().eq('id', String(formData.get('id')))
  revalidatePath('/budget')
  revalidatePath('/dashboard')
}

// ---- Eventi calendario ----
export async function createEvent(formData: FormData) {
  const supabase = await createClient()
  const uid = await currentUserId()
  const title = String(formData.get('title') ?? '').trim()
  const startsAt = String(formData.get('starts_at') ?? '')
  if (!title || !startsAt) return
  await supabase.from('calendar_events').insert({
    title,
    description: String(formData.get('description') ?? '') || null,
    starts_at: new Date(startsAt).toISOString(),
    all_day: formData.get('all_day') === 'on',
    project_id: String(formData.get('project_id') ?? '') || null,
    created_by: uid,
  })
  revalidatePath('/calendar')
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
