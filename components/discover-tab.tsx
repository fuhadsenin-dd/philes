'use client'

import { useEffect, useState } from 'react'
import useSWR from 'swr'
import { Check, Loader2, Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { MediaTypeToggle, MEDIA_ICONS } from '@/components/media-type'
import { inputClass } from '@/components/form-fields'
import { useWatchlist } from '@/lib/use-media-data'
import { fetchSearch, resultMeta, searchUrl, type SearchResult } from '@/lib/media-search'
import { MEDIA_TYPE_LABELS, type MediaType } from '@/lib/types'
import { cn } from '@/lib/utils'

function useDebounced<T>(value: T, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(id)
  }, [value, delay])
  return debounced
}

const PLACEHOLDERS: Record<MediaType, string> = {
  movie: 'Search movies — e.g. Dune, Past Lives',
  show: 'Search TV shows — e.g. Severance, The Bear',
  book: 'Search books — e.g. Piranesi, Dune',
}

export function DiscoverTab({ onLogNow }: { onLogNow: (result: SearchResult) => void }) {
  const [mediaType, setMediaType] = useState<MediaType>('movie')
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounced(query.trim(), 350)
  const key = debouncedQuery.length >= 2 ? searchUrl(mediaType, debouncedQuery, 12) : null
  const { data, error, isLoading } = useSWR(key, fetchSearch, { keepPreviousData: true })
  const { data: watchlist, mutate: mutateWatchlist } = useWatchlist()
  const [pending, setPending] = useState<string | null>(null)
  const [failed, setFailed] = useState<string | null>(null)

  const queued = new Set((watchlist ?? []).map((w) => `${w.media_type}:${w.title.toLowerCase()}`))
  const results = key ? (data ?? []) : []
  const Icon = MEDIA_ICONS[mediaType]

  async function addToUpNext(r: SearchResult) {
    setPending(r.id)
    setFailed(null)
    const { error: dbError } = await createClient()
      .from('watchlist_items')
      .insert({
        media_type: r.mediaType,
        title: r.title.slice(0, 300),
        cover_url: r.coverUrl,
        total_pages: r.mediaType === 'book' ? r.totalPages : null,
      })
    if (dbError) {
      console.error('Add to watchlist failed:', dbError)
      setFailed(r.id)
    } else {
      await mutateWatchlist()
    }
    setPending(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-balance">Discover</h1>
        <p className="text-sm text-muted-foreground">
          Search movies, shows, and books, then log them or save them for later.
        </p>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <label htmlFor="discover-search" className="sr-only">
            Search {MEDIA_TYPE_LABELS[mediaType]}s
          </label>
          <input
            id="discover-search"
            type="search"
            autoComplete="off"
            maxLength={200}
            className={cn(inputClass, 'h-10 pl-9')}
            placeholder={PLACEHOLDERS[mediaType]}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {isLoading ? (
            <Loader2
              className="absolute top-1/2 right-3 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
              aria-hidden="true"
            />
          ) : null}
        </div>
        <div className="md:w-80">
          <MediaTypeToggle value={mediaType} onChange={setMediaType} />
        </div>
      </div>

      <div aria-live="polite" aria-busy={isLoading}>
        {!key ? (
          <EmptyState icon={<Icon className="size-5" aria-hidden="true" />} text="Start typing to search." />
        ) : error ? (
          <EmptyState icon={<Search className="size-5" aria-hidden="true" />} text={error.message} />
        ) : !isLoading && results.length === 0 ? (
          <EmptyState
            icon={<Search className="size-5" aria-hidden="true" />}
            text={`No ${MEDIA_TYPE_LABELS[mediaType].toLowerCase()}s found for “${debouncedQuery}”.`}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((r) => {
              const isQueued = queued.has(`${r.mediaType}:${r.title.toLowerCase()}`)
              return (
                <li key={r.id}>
                  <PosterCard
                    result={r}
                    queued={isQueued}
                    pending={pending === r.id}
                    failed={failed === r.id}
                    onLogNow={() => onLogNow(r)}
                    onUpNext={() => addToUpNext(r)}
                  />
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <div className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground">
        {icon}
      </div>
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function PosterCard({
  result,
  queued,
  pending,
  failed,
  onLogNow,
  onUpNext,
}: {
  result: SearchResult
  queued: boolean
  pending: boolean
  failed: boolean
  onLogNow: () => void
  onUpNext: () => void
}) {
  const Icon = MEDIA_ICONS[result.mediaType]
  const meta = resultMeta(result)
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex aspect-[2/3] items-center justify-center overflow-hidden border-b border-border bg-secondary">
        {result.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={result.coverUrl}
            alt={`Poster for ${result.title}`}
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <Icon className="size-8 text-muted-foreground/50" aria-hidden="true" />
        )}
      </div>
      <div className="flex flex-1 flex-col gap-3 p-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <h3 className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{result.title}</h3>
          {meta ? <p className="truncate text-xs text-muted-foreground">{meta}</p> : null}
        </div>
        <div className="mt-auto flex flex-col gap-1.5">
          <Button size="sm" onClick={onLogNow} aria-label={`Log ${result.title} now`}>
            <Plus aria-hidden="true" />
            Log Now
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onUpNext}
            disabled={queued || pending}
            aria-label={queued ? `${result.title} is in Up Next` : `Add ${result.title} to Up Next`}
          >
            {pending ? (
              <Loader2 className="animate-spin" aria-hidden="true" />
            ) : queued ? (
              <Check aria-hidden="true" />
            ) : (
              <Plus aria-hidden="true" />
            )}
            {queued ? 'In Up Next' : 'Up Next'}
          </Button>
          {failed ? (
            <p role="alert" className="text-xs text-destructive">
              Could not save. Try again.
            </p>
          ) : null}
        </div>
      </div>
    </article>
  )
}
