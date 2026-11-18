import { Pencil, Trash2 } from 'lucide-react'
import { Cover, MediaBadge } from '@/components/media-type'
import { StarDisplay } from '@/components/star-rating'
import { statusLabel, type Entry } from '@/lib/types'

function metaLine(entry: Entry) {
  const parts: string[] = []
  if (entry.media_type === 'show') {
    const se = [
      entry.season !== null ? `S${entry.season}` : null,
      entry.episode !== null ? `E${entry.episode}` : null,
    ]
      .filter(Boolean)
      .join(' · ')
    if (se) parts.push(se)
  }
  if (entry.media_type === 'book' && entry.start_page !== null && entry.end_page !== null) {
    parts.push(`pp. ${entry.start_page}–${entry.end_page} (${Math.max(0, entry.end_page - entry.start_page)} pages)`)
  }
  parts.push(statusLabel(entry.status, entry.media_type))
  return parts.join(' · ')
}

export function EntryCard({
  entry,
  onEdit,
  onDelete,
}: {
  entry: Entry
  onEdit: () => void
  onDelete: () => void
}) {
  const progress =
    entry.media_type === 'book' && entry.total_pages && entry.end_page !== null
      ? Math.min(100, Math.round((entry.end_page / entry.total_pages) * 100))
      : null

  return (
    <article className="group flex gap-4 rounded-xl border border-border bg-card p-4">
      <Cover src={entry.cover_url} title={entry.title} type={entry.media_type} className="h-20 w-14" />
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <MediaBadge type={entry.media_type} />
              <StarDisplay value={entry.rating} />
            </div>
            <h3 className="truncate font-medium">{entry.title}</h3>
            <p className="text-xs text-muted-foreground">{metaLine(entry)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1 opacity-100 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <button
              type="button"
              onClick={onEdit}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Pencil className="size-4" aria-hidden="true" />
              <span className="sr-only">{`Edit ${entry.title}`}</span>
            </button>
            <button
              type="button"
              onClick={onDelete}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
            >
              <Trash2 className="size-4" aria-hidden="true" />
              <span className="sr-only">{`Delete ${entry.title}`}</span>
            </button>
          </div>
        </div>

        {entry.notes ? (
          <p className="text-pretty text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{entry.notes}</p>
        ) : null}

        {progress !== null ? (
          <div className="flex items-center gap-3">
            <div
              role="progressbar"
              aria-label={`Reading progress for ${entry.title}`}
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-secondary"
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">{progress}% read</span>
          </div>
        ) : null}
      </div>
    </article>
  )
}
