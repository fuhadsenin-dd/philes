'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Modal } from '@/components/modal'
import { Field, inputClass } from '@/components/form-fields'
import { Cover, MediaTypeToggle } from '@/components/media-type'
import { StarInput } from '@/components/star-rating'
import { FetchInfoButton, FetchInfoResults, useFetchInfo } from '@/components/fetch-info'
import { todayISO } from '@/lib/dates'
import { statusLabel, type EntryStatus, type LogPrefill, type MediaType } from '@/lib/types'

function toStr(n: number | null | undefined) {
  return n === null || n === undefined ? '' : String(n)
}

function toInt(s: string) {
  if (s.trim() === '') return null
  const n = Number.parseInt(s, 10)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export function LogModal({
  open,
  prefill,
  onClose,
  onSaved,
}: {
  open: boolean
  prefill: LogPrefill | null
  onClose: () => void
  onSaved: () => void | Promise<void>
}) {
  const isEdit = Boolean(prefill?.id)
  const [mediaType, setMediaType] = useState<MediaType>(prefill?.media_type ?? 'movie')
  const [title, setTitle] = useState(prefill?.title ?? '')
  const [coverUrl, setCoverUrl] = useState(prefill?.cover_url ?? '')
  const [season, setSeason] = useState(toStr(prefill?.season))
  const [episode, setEpisode] = useState(toStr(prefill?.episode))
  const [startPage, setStartPage] = useState(toStr(prefill?.start_page))
  const [endPage, setEndPage] = useState(toStr(prefill?.end_page))
  const [totalPages, setTotalPages] = useState(toStr(prefill?.total_pages))
  const [rating, setRating] = useState(prefill?.rating ?? 0)
  const [status, setStatus] = useState<EntryStatus>(prefill?.status ?? 'completed')
  const [notes, setNotes] = useState(prefill?.notes ?? '')
  const [loggedDate, setLoggedDate] = useState(prefill?.logged_date ?? todayISO())
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const info = useFetchInfo((r) => {
    setTitle(r.title)
    setCoverUrl(r.coverUrl ?? '')
    if (r.totalPages) setTotalPages(String(r.totalPages))
  })

  function changeMediaType(type: MediaType) {
    setMediaType(type)
    info.reset()
  }

  const start = toInt(startPage)
  const end = toInt(endPage)
  const pagesCovered = start !== null && end !== null && end >= start ? end - start : null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (!title.trim()) {
      setError('Title is required.')
      return
    }
    if (mediaType === 'book' && start !== null && end !== null && end < start) {
      setError('End page must be after start page.')
      return
    }

    const payload = {
      media_type: mediaType,
      title: title.trim().slice(0, 300),
      cover_url: coverUrl.trim() || null,
      season: mediaType === 'show' ? toInt(season) : null,
      episode: mediaType === 'show' ? toInt(episode) : null,
      start_page: mediaType === 'book' ? start : null,
      end_page: mediaType === 'book' ? end : null,
      total_pages: mediaType === 'book' ? toInt(totalPages) : null,
      rating: rating > 0 ? rating : null,
      status,
      notes: notes.trim() ? notes.trim().slice(0, 5000) : null,
      logged_date: loggedDate || todayISO(),
    }

    setSaving(true)
    const supabase = createClient()
    const { error: dbError } = isEdit
      ? await supabase.from('entries').update(payload).eq('id', prefill!.id!)
      : await supabase.from('entries').insert(payload)
    setSaving(false)

    if (dbError) {
      console.error('Save entry failed:', dbError)
      setError('Could not save this entry. Please try again.')
      return
    }
    await onSaved()
  }

  return (
    <Modal open={open} onClose={onClose} title={isEdit ? 'Edit entry' : 'Log media'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <MediaTypeToggle value={mediaType} onChange={changeMediaType} />

        <div className="flex items-start gap-3">
          <Cover src={coverUrl || null} title={title} type={mediaType} className="h-16 w-11" />
          <Field label="Title" htmlFor="log-title" className="flex-1">
            <input
              id="log-title"
              required
              maxLength={300}
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={mediaType === 'book' ? 'e.g. Piranesi' : mediaType === 'show' ? 'e.g. Severance' : 'e.g. Past Lives'}
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

        {mediaType === 'show' ? (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Season" htmlFor="log-season">
              <input id="log-season" type="number" min={0} inputMode="numeric" className={inputClass} value={season} onChange={(e) => setSeason(e.target.value)} />
            </Field>
            <Field label="Episode" htmlFor="log-episode">
              <input id="log-episode" type="number" min={0} inputMode="numeric" className={inputClass} value={episode} onChange={(e) => setEpisode(e.target.value)} />
            </Field>
          </div>
        ) : null}

        {mediaType === 'book' ? (
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-3 gap-3">
              <Field label="Start page" htmlFor="log-start">
                <input id="log-start" type="number" min={0} inputMode="numeric" className={inputClass} value={startPage} onChange={(e) => setStartPage(e.target.value)} />
              </Field>
              <Field label="End page" htmlFor="log-end">
                <input id="log-end" type="number" min={0} inputMode="numeric" className={inputClass} value={endPage} onChange={(e) => setEndPage(e.target.value)} />
              </Field>
              <Field label="Total pages" htmlFor="log-total">
                <input id="log-total" type="number" min={0} inputMode="numeric" className={inputClass} value={totalPages} onChange={(e) => setTotalPages(e.target.value)} />
              </Field>
            </div>
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {pagesCovered !== null ? (
                <>
                  <span className="font-mono text-foreground">{pagesCovered}</span> pages covered today
                </>
              ) : (
                'Enter start and end pages to calculate pages covered.'
              )}
            </p>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Field label="Date logged" htmlFor="log-date">
            <input id="log-date" type="date" required className={inputClass} value={loggedDate} onChange={(e) => setLoggedDate(e.target.value)} />
          </Field>
          <Field label="Status" htmlFor="log-status">
            <select id="log-status" className={inputClass} value={status} onChange={(e) => setStatus(e.target.value as EntryStatus)}>
              {(['completed', 'in_progress', 'rewatch'] as const).map((s) => (
                <option key={s} value={s}>
                  {statusLabel(s, mediaType)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Rating" htmlFor="log-rating">
          <StarInput id="log-rating" value={rating} onChange={setRating} />
        </Field>

        <Field label="Thoughts / Takeaway" htmlFor="log-notes">
          <textarea
            id="log-notes"
            rows={3}
            maxLength={5000}
            className={`${inputClass} h-auto resize-y py-2`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What stuck with you?"
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
            {isEdit ? 'Save changes' : 'Log it'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
