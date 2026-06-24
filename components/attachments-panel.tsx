'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui'
import { IconTrash, IconFile } from '@/components/icons'
import type { Attachment } from '@/types/database'

export function AttachmentsPanel({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const [files, setFiles] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('attachments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    setFiles((data as Attachment[]) ?? [])
  }, [supabase, projectId])

  useEffect(() => {
    // Caricamento iniziale: lo stato si aggiorna dopo l'await, non in modo sincrono.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load()
  }, [load])

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Limite dimensione: evita upload accidentali di file enormi.
    const MAX_BYTES = 25 * 1024 * 1024
    if (file.size > MAX_BYTES) {
      setError('File troppo grande: massimo 25 MB.')
      e.target.value = ''
      return
    }
    setUploading(true)
    setError(null)
    try {
      const path = `${projectId}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('tstack-attachments').upload(path, file)
      if (upErr) throw upErr
      const { error: insErr } = await supabase.from('attachments').insert({
        project_id: projectId,
        file_path: path,
        file_name: file.name,
        mime_type: file.type,
        size_bytes: file.size,
      })
      if (insErr) throw insErr
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'errore sconosciuto'
      setError(`Caricamento non riuscito: ${msg}`)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function download(att: Attachment) {
    const { data } = await supabase.storage.from('tstack-attachments').createSignedUrl(att.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  async function remove(att: Attachment) {
    if (!confirm(`Eliminare l'allegato “${att.file_name}”?`)) return
    setDeletingId(att.id)
    setError(null)
    try {
      // Prima il file nello storage, poi il record (così non restano orfani).
      const { error: stErr } = await supabase.storage.from('tstack-attachments').remove([att.file_path])
      if (stErr) throw stErr
      const { error: dbErr } = await supabase.from('attachments').delete().eq('id', att.id)
      if (dbErr) throw dbErr
      await load()
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'errore sconosciuto'
      setError(`Eliminazione non riuscita: ${msg}`)
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section>
      <h2 className="mb-2 font-display font-bold text-[#1A1F2B]">Allegati</h2>
      <Card className="space-y-3">
        <label className="flex cursor-pointer items-center justify-center rounded-[10px] border border-dashed border-[#C4CBD6] px-4 py-3 text-sm font-bold text-brand">
          {uploading ? 'Caricamento…' : '+ Carica file'}
          <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {files.length === 0 ? (
          <p className="text-sm text-slate-500">Nessun allegato.</p>
        ) : (
          <ul className="space-y-1.5">
            {files.map((f) => (
              <li key={f.id} className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-[#F7F8FA]">
                <button onClick={() => download(f)} className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm">
                  <IconFile size={16} className="shrink-0 text-[#6B7280]" />
                  <span className="truncate text-[#1A1F2B]">{f.file_name}</span>
                  <span className="ml-auto shrink-0 text-xs font-bold text-brand">Scarica</span>
                </button>
                <button
                  onClick={() => remove(f)}
                  disabled={deletingId === f.id}
                  aria-label="Elimina allegato"
                  className="press flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[#6B7280] hover:bg-[#FBEAE6] hover:text-danger disabled:opacity-50"
                >
                  {deletingId === f.id ? <span className="spinner" style={{ width: '0.9rem', height: '0.9rem' }} /> : <IconTrash size={16} />}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
