'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { ProjectStatus, TaskStatus, TxType } from '@/types/database'

async function currentUserId() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user?.id ?? null
}

// ---- Clienti ----
export async function createClientRecord(formData: FormData) {
  const supabase = await createClient()
  const name = String(formData.get('name') ?? '').trim()
  if (!name) return
  await supabase.from('clients').insert({
    name,
    contact_email: String(formData.get('contact_email') ?? '') || null,
    phone: String(formData.get('phone') ?? '') || null,
    notes: String(formData.get('notes') ?? '') || null,
  })
  revalidatePath('/clients')
  redirect('/clients')
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
      client_id: String(formData.get('client_id') ?? '') || null,
      status: (String(formData.get('status') ?? 'attivo') as ProjectStatus),
      due_date: String(formData.get('due_date') ?? '') || null,
      budget_amount: Number(formData.get('budget_amount') ?? 0) || 0,
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
  const status = String(formData.get('status')) as ProjectStatus
  await supabase.from('projects').update({ status }).eq('id', id)
  revalidatePath(`/projects/${id}`)
  revalidatePath('/projects')
}

// ---- Task ----
export async function createTask(formData: FormData) {
  const supabase = await createClient()
  const projectId = String(formData.get('project_id'))
  const title = String(formData.get('title') ?? '').trim()
  if (!title || !projectId) return
  await supabase.from('tasks').insert({
    project_id: projectId,
    title,
    description: String(formData.get('description') ?? '') || null,
    priority: String(formData.get('priority') ?? 'media'),
    assignee_id: String(formData.get('assignee_id') ?? '') || null,
    due_date: String(formData.get('due_date') ?? '') || null,
  })
  revalidatePath(`/projects/${projectId}`)
  revalidatePath('/tasks')
}

export async function setTaskStatus(formData: FormData) {
  const supabase = await createClient()
  const id = String(formData.get('id'))
  const status = String(formData.get('status')) as TaskStatus
  await supabase.from('tasks').update({ status }).eq('id', id)
  revalidatePath('/tasks')
  const projectId = String(formData.get('project_id') ?? '')
  if (projectId) revalidatePath(`/projects/${projectId}`)
}

// ---- Transazioni (bilancio) ----
export async function createTransaction(formData: FormData) {
  const supabase = await createClient()
  const uid = await currentUserId()
  const type = String(formData.get('type') ?? 'entrata') as TxType
  const amount = Number(formData.get('amount') ?? 0)
  if (!amount || amount <= 0) return
  await supabase.from('transactions').insert({
    type,
    amount,
    description: String(formData.get('description') ?? '') || null,
    category: String(formData.get('category') ?? '') || null,
    project_id: String(formData.get('project_id') ?? '') || null,
    occurred_on: String(formData.get('occurred_on') ?? '') || new Date().toISOString().slice(0, 10),
    created_by: uid,
  })
  const projectId = String(formData.get('project_id') ?? '')
  revalidatePath('/budget')
  if (projectId) revalidatePath(`/projects/${projectId}`)
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
