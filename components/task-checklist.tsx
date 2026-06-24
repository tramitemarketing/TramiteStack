'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { IconTrash, IconPlus } from '@/components/icons'
import { useToast } from '@/components/toast'

type Item = { id: string; body: string; done: boolean; position: number }

export function TaskChecklist({ taskId }: { taskId: string }) {
  const [items, setItems] = useState<Item[]>([])
  const [text, setText] = useState('')
  const router = useRouter()
  const toast = useToast()

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('task_checklist')
      .select('id, body, done, position')
      .eq('task_id', taskId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: true })
    setItems((data as Item[]) ?? [])
  }, [taskId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  // Auto-stato della task in base alla checklist.
  async function applyStatus(list: Item[]) {
    const total = list.length
    if (total === 0) return
    const done = list.filter((i) => i.done).length
    const status = done === total ? 'completato' : done >= 1 ? 'in_corso' : 'da_fare'
    const supabase = createClient()
    await supabase.from('tasks').update({ status }).eq('id', taskId)
  }

  async function add() {
    const body = text.trim()
    if (!body) return
    const supabase = createClient()
    const { error } = await supabase.from('task_checklist').insert({ task_id: taskId, body, position: items.length })
    if (error) {
      toast.error('Voce non aggiunta. Riprova.')
      return
    }
    setText('')
    const { data } = await supabase.from('task_checklist').select('id, body, done, position').eq('task_id', taskId).order('position').order('created_at')
    const list = (data as Item[]) ?? []
    setItems(list)
    await applyStatus(list)
    router.refresh()
  }

  async function toggle(item: Item) {
    const supabase = createClient()
    const prev = items
    const next = items.map((i) => (i.id === item.id ? { ...i, done: !i.done } : i))
    setItems(next)
    const { error } = await supabase.from('task_checklist').update({ done: !item.done }).eq('id', item.id)
    if (error) {
      setItems(prev)
      toast.error('Aggiornamento non riuscito. Riprova.')
      return
    }
    await applyStatus(next)
    router.refresh()
  }

  async function remove(item: Item) {
    const supabase = createClient()
    const prev = items
    const next = items.filter((i) => i.id !== item.id)
    setItems(next)
    const { error } = await supabase.from('task_checklist').delete().eq('id', item.id)
    if (error) {
      setItems(prev)
      toast.error('Eliminazione non riuscita. Riprova.')
      return
    }
    await applyStatus(next)
    router.refresh()
  }

  const done = items.filter((i) => i.done).length
  const pct = items.length ? Math.round((done / items.length) * 100) : 0

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-bold text-[#5A6473]">Checklist {items.length > 0 && `(${done}/${items.length})`}</p>
        {items.length > 0 && <span className="text-[11px] font-bold text-[#6B7280] tnum">{pct}%</span>}
      </div>
      {items.length > 0 && (
        <div className="mb-2 h-1.5 w-full overflow-hidden rounded-full bg-[#EFF1F5]">
          <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? 'var(--ok)' : 'var(--brand)' }} />
        </div>
      )}
      <div className="space-y-1">
        {items.map((i) => (
          <div key={i.id} className="flex items-center gap-2.5 rounded-lg px-1 py-1 hover:bg-[#F7F8FA]">
            <input type="checkbox" checked={i.done} onChange={() => toggle(i)} className="h-4 w-4 shrink-0 accent-[#0F4C81]" />
            <span className={i.done ? 'flex-1 text-sm font-medium text-[#6B7280] line-through' : 'flex-1 text-sm font-medium text-[#3E4757]'}>{i.body}</span>
            <button onClick={() => remove(i)} aria-label="Elimina voce" className="press text-[#6B7280] hover:text-danger">
              <IconTrash size={14} />
            </button>
          </div>
        ))}
      </div>
      <div className="mt-2 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void add() } }}
          placeholder="Aggiungi voce…"
          className="w-full rounded-[10px] border border-[#E0E4EB] px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]"
        />
        <button onClick={add} disabled={!text.trim()} className="press flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-white disabled:opacity-50" style={{ backgroundColor: 'var(--brand)' }} aria-label="Aggiungi">
          <IconPlus size={18} strokeWidth={2.6} />
        </button>
      </div>
    </div>
  )
}
