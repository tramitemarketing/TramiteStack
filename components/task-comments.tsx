'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Avatar } from '@/components/ui'
import { IconTrash } from '@/components/icons'
import { formatDate } from '@/lib/utils'
import type { MemberInfo } from '@/components/assignees'

type Comment = {
  id: string
  body: string
  created_at: string
  author_id: string | null
  author: { username: string | null; color: string | null } | null
}

const MENTION_RE = /@([A-Za-z0-9_.\-]+)/g

// Mostra il testo evidenziando le @menzioni.
function renderBody(body: string) {
  const parts: React.ReactNode[] = []
  let last = 0
  let m: RegExpExecArray | null
  MENTION_RE.lastIndex = 0
  while ((m = MENTION_RE.exec(body)) !== null) {
    if (m.index > last) parts.push(body.slice(last, m.index))
    parts.push(<span key={m.index} className="font-bold text-brand">@{m[1]}</span>)
    last = m.index + m[0].length
  }
  if (last < body.length) parts.push(body.slice(last))
  return parts
}

export function TaskComments({ taskId, members }: { taskId: string; members: MemberInfo[] }) {
  const [comments, setComments] = useState<Comment[]>([])
  const [me, setMe] = useState<string | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [mentionQuery, setMentionQuery] = useState<string | null>(null)
  const mentionStart = useRef(0)
  const taRef = useRef<HTMLTextAreaElement>(null)

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

  function onChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value
    setText(value)
    const caret = e.target.selectionStart ?? value.length
    // Trova un '@token' attaccato al cursore (senza spazi).
    const upto = value.slice(0, caret)
    const at = upto.lastIndexOf('@')
    if (at >= 0 && !/\s/.test(upto.slice(at + 1))) {
      mentionStart.current = at
      setMentionQuery(upto.slice(at + 1).toLowerCase())
    } else {
      setMentionQuery(null)
    }
  }

  function pickMention(username: string) {
    const caret = taRef.current?.selectionStart ?? text.length
    const before = text.slice(0, mentionStart.current)
    const after = text.slice(caret)
    const next = `${before}@${username} ${after}`
    setText(next)
    setMentionQuery(null)
    setTimeout(() => taRef.current?.focus(), 0)
  }

  const candidates =
    mentionQuery === null
      ? []
      : members.filter((m) => (m.username ?? '').toLowerCase().startsWith(mentionQuery)).slice(0, 5)

  async function send() {
    const body = text.trim()
    if (!body || !me) return
    setBusy(true)
    const supabase = createClient()
    const { error } = await supabase.from('task_comments').insert({ task_id: taskId, author_id: me, body })
    if (!error) {
      // Notifica le persone menzionate (escluso l'autore)
      const names = [...body.matchAll(MENTION_RE)].map((x) => x[1].toLowerCase())
      const mentioned = members.filter((m) => m.username && names.includes(m.username.toLowerCase()) && m.id !== me)
      await Promise.all(
        mentioned.map((m) =>
          supabase.rpc('create_notification', {
            p_user_id: m.id,
            p_type: 'menzione',
            p_title: 'Ti hanno menzionato in un commento',
            p_body: body.slice(0, 120),
            p_entity_type: 'task',
            p_entity_id: taskId,
          }),
        ),
      )
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
              <p className="whitespace-pre-wrap break-words text-sm font-medium text-[#3E4757]">{renderBody(c.body)}</p>
            </div>
          </div>
        ))}
        {comments.length === 0 && <p className="text-sm font-medium text-[#9CA5B3]">Ancora nessun commento.</p>}
      </div>

      <div className="relative mt-3 flex items-end gap-2">
        {candidates.length > 0 && (
          <div className="absolute bottom-full left-0 mb-1 w-56 overflow-hidden rounded-xl border border-[#E0E4EB] bg-white shadow-lg">
            {candidates.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => pickMention(m.username || '')}
                className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-[#F7F8FA]"
              >
                <Avatar name={m.username} size={22} color={m.color} />
                <span className="text-sm font-semibold text-[#3E4757]">{m.username || 'Utente'}</span>
              </button>
            ))}
          </div>
        )}
        <textarea
          ref={taRef}
          value={text}
          onChange={onChange}
          rows={1}
          placeholder="Scrivi un commento…  (usa @ per menzionare)"
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
