'use client'

import { useState } from 'react'
import { ListPlus, Play, Plus, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Pill } from '@/components/form-fields'
import { Cover, MediaBadge } from '@/components/media-type'
import { WatchlistModal } from '@/components/watchlist-modal'
import { useWatchlist } from '@/lib/use-media-data'
import type { MediaType, WatchlistItem } from '@/lib/types'

const TYPE_FILTERS: { value: MediaType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'show', label: 'Shows' },
  { value: 'book', label: 'Books' },
]

export function UpNextTab({ onLogNow }: { onLogNow: (item: WatchlistItem) => void }) {
  const { data: items, error, isLoading, mutate } = useWatchlist()
  const [type, setType] = useState<MediaType | 'all'>('all')
  const [addKey, setAddKey] = useState<number | null>(null)

  const filtered = (items ?? []).filter((i) => type === 'all' || i.media_type === type)

  async function handleRemove(item: WatchlistItem) {
    await mutate(
      async (current) => {
        const { error } = await createClient().from('watchlist_items').delete().eq('id', item.id)
        if (error) throw error
        return (current ?? []).filter((i) => i.id !== item.id)
      },
      {
        optimisticData: (current) => (current ?? []).filter((i) => i.id !== item.id),
        rollbackOnError: true,
        revalidate: false,
      },
    ).catch((err) => console.error('Remove from watchlist failed:', err))
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by media type">
          {TYPE_FILTERS.map((f) => (
            <Pill key={f.value} active={type === f.value} onClick={() => setType(f.value)}>
              {f.label}
            </Pill>
          ))}
        </div>
        <Button variant="outline" size="lg" onClick={() => setAddKey(Date.now())}>
          <Plus aria-hidden="true" />
          Add to Up Next
        </Button>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load your list. Please refresh the page.
        </p>
      ) : isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading list">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-40 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <ListPlus className="size-8 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">{items && items.length > 0 ? 'Nothing here for this filter' : 'Nothing queued up yet'}</p>
          <p className="text-sm text-muted-foreground">Save the things you want to watch or read next.</p>
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
              <div className="flex gap-3">
                <Cover src={item.cover_url} title={item.title} type={item.media_type} className="h-20 w-14" />
                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <MediaBadge type={item.media_type} />
                    <button
                      type="button"
                      onClick={() => handleRemove(item)}
                      className="-mt-1 -mr-1 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-destructive/15 hover:text-destructive"
                    >
                      <Trash2 className="size-4" aria-hidden="true" />
                      <span className="sr-only">{`Remove ${item.title}`}</span>
                    </button>
                  </div>
                  <h3 className="line-clamp-2 font-medium">{item.title}</h3>
                  {item.total_pages ? (
                    <p className="text-xs text-muted-foreground">{item.total_pages} pages</p>
                  ) : null}
                </div>
              </div>
              {item.pitch_note ? (
                <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">{item.pitch_note}</p>
              ) : null}
              <Button className="mt-auto w-full" onClick={() => onLogNow(item)}>
                <Play aria-hidden="true" />
                Log Now
              </Button>
            </li>
          ))}
        </ul>
      )}

      {addKey !== null ? (
        <WatchlistModal
          key={addKey}
          open
          onClose={() => setAddKey(null)}
          onSaved={async () => {
            await mutate()
            setAddKey(null)
          }}
        />
      ) : null}
    </div>
  )
}
