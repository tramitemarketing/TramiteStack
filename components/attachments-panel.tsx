'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card } from '@/components/ui'
import type { Attachment } from '@/types/database'

export function AttachmentsPanel({ projectId }: { projectId: string }) {
  const supabase = createClient()
  const [files, setFiles] = useState<Attachment[]>([])
  const [uploading, setUploading] = useState(false)
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
    setUploading(true)
    setError(null)
    try {
      const path = `${projectId}/${Date.now()}-${file.name}`
      const { error: upErr } = await supabase.storage.from('attachments').upload(path, file)
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
    } catch {
      setError('Caricamento non riuscito. Controlla di avere i permessi.')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  async function download(att: Attachment) {
    const { data } = await supabase.storage.from('attachments').createSignedUrl(att.file_path, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  return (
    <section>
      <h2 className="mb-2 font-semibold">Allegati</h2>
      <Card className="space-y-3">
        <label className="flex cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-indigo-600">
          {uploading ? 'Caricamento…' : '+ Carica file'}
          <input type="file" className="hidden" onChange={onUpload} disabled={uploading} />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {files.length === 0 ? (
          <p className="text-sm text-slate-400">Nessun allegato.</p>
        ) : (
          <ul className="space-y-1.5">
            {files.map((f) => (
              <li key={f.id}>
                <button
                  onClick={() => download(f)}
                  className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-50"
                >
                  <span className="truncate">{f.file_name}</span>
                  <span className="text-xs text-indigo-600">Scarica</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </section>
  )
}
