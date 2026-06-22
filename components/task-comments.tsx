'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui'
import { IconTrash } from '@/components/icons'
import { formatDate } from '@/lib/utils'

type Comment = {
  id: string
  body: string
  created_at: string
  author_id: string | null
  author: { username: string | null; color: string | null } | null
}

export function TaskComments({ taskId }: { taskId: string }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()
    const [{ data }, { data: auth }] = await Promise.all([
      supabase
        .from('task_comments')
        .select('id, body, created_at, author_id, author:profiles!author_id(username, color)')
        .eq('task_id', taskId)
        .order('created_at', { ascending: true }),
      supabase.auth.getUser(),
    ])
    setComments((data as unknown as Comment[]) ?? [])
    setMe(auth.user?.id ?? null)
  }, [taskId])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function send() {
    const body = text.trim()
    if (!body || !me) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from('task_comments').insert({ task_id: taskId, author_id: me, body })
    if (!error) {
      setText('')
      await load()
    }
    setBusy(false)
  }

  async function remove(id: string) {
    const supabase = createClient()
    await supabase.from('task_comments').delete().eq('id', id)
    await load()
  }

  return (
    <div>
      <p className="mb-1 block text-xs font-bold text-[#5A6473]">Commenti ({comments.length})</p>
      <div className="space-y-2.5">
        {comments.map((c) => (
          <div key={c.id} className="flex items-start gap-2.5">
            <Avatar name={c.author?.username} size={26} color={c.author?.color} />
            <div className="min-w-0 flex-1 rounded-[10px] bg-[#F7F8FA] px-3 py-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-[#1A1F2B]">{c.author?.username || 'Utente'}</span>
                <span className="flex items-center gap-1.5">
                  <span className="text-[10px] font-semibold text-[#9CA5B3]">{formatDate(c.created_at, 'd MMM')}</span>
                  {c.author_id === me && (
                    <button onClick={() => remove(c.id)} aria-label="Elimina commento" className="press text-[#C4CBD6] hover:text-danger">
                      <IconTrash size={14} />
                    </button>
                  )}
                </span>
              </div>
              <p className="whitespace-pre-wrap break-words text-sm font-medium text-[#3E4757]">{c.body}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm font-medium text-[#9CA5B3]">Ancora nessun commento.</p>}
      </div>

      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={1}
          placeholder="Scrivi un commento…"
          className="min-h-[42px] w-full resize-none rounded-[10px] border border-[#E0E4EB] px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-[#B3D2F0]"
        />
        <button
          onClick={send}
          disabled={busy || !text.trim()}
          className="press shrink-0 rounded-[10px] px-4 py-2.5 text-sm font-bold text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--brand)' }}
        >
          Invia
        </button>
      </div>
    </div>
  )
}
