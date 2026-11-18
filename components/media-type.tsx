import { BookOpen, Film, Tv } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MEDIA_TYPE_LABELS, type MediaType } from '@/lib/types'

export const MEDIA_ICONS = { movie: Film, show: Tv, book: BookOpen } as const

export function MediaBadge({ type }: { type: MediaType }) {
  const Icon = MEDIA_ICONS[type]
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-secondary px-1.5 py-0.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
      <Icon className="size-3" aria-hidden="true" />
      {MEDIA_TYPE_LABELS[type]}
    </span>
  )
}

export function MediaTypeToggle({
  value,
  onChange,
}: {
  value: MediaType
  onChange: (type: MediaType) => void
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Media type"
      className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-background p-1"
    >
      {(Object.keys(MEDIA_TYPE_LABELS) as MediaType[]).map((type) => {
        const Icon = MEDIA_ICONS[type]
        const active = value === type
        return (
          <button
            key={type}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(type)}
            className={cn(
              'flex h-8 items-center justify-center gap-1.5 rounded-md text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
              active
                ? 'bg-secondary text-foreground'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
            {MEDIA_TYPE_LABELS[type]}
          </button>
        )
      })}
    </div>
  )
}

export function Cover({
  src,
  title,
  type,
  className,
}: {
  src: string | null
  title: string
  type: MediaType
  className?: string
}) {
  const Icon = MEDIA_ICONS[type]
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-secondary',
        className,
      )}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={`Cover of ${title}`} className="size-full object-cover" loading="lazy" />
      ) : (
        <Icon className="size-5 text-muted-foreground/60" aria-hidden="true" />
      )}
    </div>
  )
}
