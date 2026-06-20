// Tipi del database T-Stack (schema `tstack`).
// Mantenere allineato con supabase/migrations/0001_tstack_init.sql + 0002_tstack_redesign.sql.

export type UserRole = 'admin' | 'member'
export type ProjectStatus = 'attivo' | 'in_corso' | 'completato' | 'sospeso'
export type TaskStatus = 'da_fare' | 'in_corso' | 'in_revisione' | 'completato'
export type TxType = 'entrata' | 'uscita'

export interface Profile {
  id: string
  full_name: string
  role: UserRole
  avatar_url: string | null
  active: boolean
  created_at: string
  updated_at: string
}

export interface Client {
  id: string
  name: string
  contact_email: string | null
  phone: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Project {
  id: string
  client_id: string | null
  name: string
  description: string | null
  status: ProjectStatus
  priority_level: number // 1–5
  start_date: string | null
  due_date: string | null
  budget_amount: number
  created_at: string
  updated_at: string
}

export interface Task {
  id: string
  project_id: string
  title: string
  description: string | null
  status: TaskStatus
  priority_level: number // 1–5
  assignee_id: string | null
  due_date: string | null
  position: number
  created_at: string
  updated_at: string
}

export interface CalendarEvent {
  id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string | null
  all_day: boolean
  project_id: string | null
  task_id: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  project_id: string | null
  owner_id: string | null
  type: TxType
  amount: number
  currency: string
  description: string | null
  category: string | null
  occurred_on: string
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface Attachment {
  id: string
  project_id: string | null
  task_id: string | null
  file_path: string
  file_name: string
  mime_type: string | null
  size_bytes: number | null
  uploaded_by: string | null
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  type: string
  title: string
  body: string | null
  entity_type: string | null
  entity_id: string | null
  read_at: string | null
  scheduled_for: string | null
  created_at: string
}

export interface TeamBalance {
  user_id: string
  full_name: string
  role: UserRole
  total_income: number
  total_expense: number
  balance: number
}

// Etichette leggibili (UI in italiano)
export const PROJECT_STATUS_LABEL: Record<ProjectStatus, string> = {
  attivo: 'Attivo',
  in_corso: 'In corso',
  completato: 'Completato',
  sospeso: 'Sospeso',
}

export const TASK_STATUS_LABEL: Record<TaskStatus, string> = {
  da_fare: 'Da fare',
  in_corso: 'In corso',
  in_revisione: 'In revisione',
  completato: 'Completato',
}

export const TASK_STATUS_ORDER: TaskStatus[] = ['da_fare', 'in_corso', 'in_revisione', 'completato']

// Priorità 1–5: etichetta e colore
export const PRIORITY_LABEL: Record<number, string> = {
  1: 'Molto bassa',
  2: 'Bassa',
  3: 'Media',
  4: 'Alta',
  5: 'Urgente',
}

export function priorityColor(level: number): string {
  if (level >= 5) return 'bg-red-500'
  if (level === 4) return 'bg-orange-500'
  if (level === 3) return 'bg-amber-500'
  if (level === 2) return 'bg-sky-500'
  return 'bg-slate-400'
}
