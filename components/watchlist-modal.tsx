'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/modal'
import { Field, inputClass } from '@/components/form-fields'
import { Cover, MediaTypeToggle } from '@/components/media-type'
import { FetchInfoButton, FetchInfoResults, useFetchInfo } from '@/components/fetch-info'
import type { MediaType } from '@/lib/types'

export function WatchlistModal({
  open,
  onClose,
  onSaved,
}: {
  open: boolean
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const [mediaType, setMediaType] = useState<MediaType>('movie')
  const [title, setTitle] = useState('')
  const [coverUrl, setCoverUrl] = useState<string | null>(null)
  const [totalPages, setTotalPages] = useState<number | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const info = useFetchInfo((r) => {
    setTitle(r.title)
    setCoverUrl(r.coverUrl)
    setTotalPages(r.totalPages)
  })

  function changeMediaType(type: MediaType) {
    setMediaType(type)
    setCoverUrl(null)
    setTotalPages(null)
    info.reset()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    setSaving(true)
    setError(null)
    const { error: dbError } = await createClient()
      .from('watchlist_items')
      .insert({
        media_type: mediaType,
        title: title.trim().slice(0, 300),
        cover_url: coverUrl,
        total_pages: mediaType === 'book' ? totalPages : null,
        pitch_note: note.trim() ? note.trim().slice(0, 1000) : null,
      })
    setSaving(false)
    if (dbError) {
      console.error('Add to watchlist failed:', dbError)
      setError('Could not add this item. Please try again.')
      return
    }
    await onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title="Add to Up Next">
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <MediaTypeToggle value={mediaType} onChange={changeMediaType} />

        <div className="flex items-start gap-3">
          <Cover src={coverUrl} title={title} type={mediaType} className="h-16 w-11" />
          <Field
            label="Title"
            htmlFor="wl-title"
            className="flex-1"
            hint={mediaType === 'book' && totalPages ? `${totalPages} pages` : undefined}
          >
            <input
              id="wl-title"
              required
              maxLength={300}
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </Field>
          <div className="pt-5">
            <FetchInfoButton loading={info.loading} onClick={() => info.lookup(title, mediaType)} />
          </div>
        </div>
        <FetchInfoResults
          results={info.results}
          selectedId={info.selectedId}
          message={info.message}
          onSelect={info.select}
        />

        <Field label="Why it's on your list" htmlFor="wl-note">
          <textarea
            id="wl-note"
            rows={2}
            maxLength={1000}
            className={`${inputClass} h-auto resize-y py-2`}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Recommended by Sam, apparently the ending is wild…"
          />
        </Field>

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button type="button" variant="ghost" size="lg" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="lg" disabled={saving}>
            {saving ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
            Add to Up Next
          </Button>
        </div>
      </form>
    </Modal>
  )
}
