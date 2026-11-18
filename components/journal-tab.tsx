'use client'

import { useMemo, useState } from 'react'
import { NotebookPen, Plus, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Pill, inputClass } from '@/components/form-fields'
import { StatsBar } from '@/components/stats-bar'
import { EntryCard } from '@/components/entry-card'
import { useEntries } from '@/lib/use-media-data'
import { dateLabel } from '@/lib/dates'
import type { Entry, EntryStatus, MediaType } from '@/lib/types'
import { cn } from '@/lib/utils'

const TYPE_FILTERS: { value: MediaType | 'all'; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'movie', label: 'Movies' },
  { value: 'show', label: 'Shows' },
  { value: 'book', label: 'Books' },
]

export function JournalTab({ onEdit, onLog }: { onEdit: (entry: Entry) => void; onLog: () => void }) {
  const { data: entries, error, isLoading, mutate } = useEntries()
  const [type, setType] = useState<MediaType | 'all'>('all')
  const [status, setStatus] = useState<EntryStatus | 'all'>('all')
  const [query, setQuery] = useState('')

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase()
    const filtered = (entries ?? []).filter(
      (e) =>
        (type === 'all' || e.media_type === type) &&
        (status === 'all' || e.status === status) &&
        (!q || e.title.toLowerCase().includes(q)),
    )
    const map = new Map<string, Entry[]>()
    for (const e of filtered) {
      const list = map.get(e.logged_date) ?? []
      list.push(e)
      map.set(e.logged_date, list)
    }
    return [...map.entries()]
  }, [entries, type, status, query])

  async function handleDelete(entry: Entry) {
    if (!window.confirm(`Delete "${entry.title}" from your journal?`)) return
    await mutate(
      async (current) => {
        const { error } = await createClient().from('entries').delete().eq('id', entry.id)
        if (error) throw error
        return (current ?? []).filter((e) => e.id !== entry.id)
      },
      {
        optimisticData: (current) => (current ?? []).filter((e) => e.id !== entry.id),
        rollbackOnError: true,
        revalidate: false,
      },
    ).catch((err) => console.error('Delete entry failed:', err))
  }

  return (
    <div className="flex flex-col gap-8">
      <StatsBar entries={entries ?? []} />

      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by media type">
          {TYPE_FILTERS.map((f) => (
            <Pill key={f.value} active={type === f.value} onClick={() => setType(f.value)}>
              {f.label}
            </Pill>
          ))}
        </div>
        <div className="flex gap-2">
          <label htmlFor="status-filter" className="sr-only">
            Filter by status
          </label>
          <select
            id="status-filter"
            className={cn(inputClass, 'w-auto')}
            value={status}
            onChange={(e) => setStatus(e.target.value as EntryStatus | 'all')}
          >
            <option value="all">All statuses</option>
            <option value="completed">Completed</option>
            <option value="in_progress">In Progress</option>
            <option value="rewatch">Rewatch / Reread</option>
          </select>
          <div className="relative flex-1 md:w-60 md:flex-none">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <label htmlFor="journal-search" className="sr-only">
              Search titles
            </label>
            <input
              id="journal-search"
              type="search"
              placeholder="Search titles"
              className={cn(inputClass, 'pl-9')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          Could not load your journal. Please refresh the page.
        </p>
      ) : isLoading ? (
        <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading journal">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-card" />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-16 text-center">
          <NotebookPen className="size-8 text-muted-foreground" aria-hidden="true" />
          {entries && entries.length > 0 ? (
            <p className="text-sm text-muted-foreground">No entries match these filters.</p>
          ) : (
            <>
              <div className="flex flex-col gap-1">
                <p className="font-medium">Your journal is empty</p>
                <p className="text-sm text-muted-foreground">Log your first movie, episode, or reading session.</p>
              </div>
              <Button onClick={onLog}>
                <Plus aria-hidden="true" />
                Log Media
              </Button>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {groups.map(([date, list]) => (
            <section key={date} aria-labelledby={`date-${date}`} className="flex flex-col gap-3">
              <h2 id={`date-${date}`} className="flex items-center gap-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {dateLabel(date)}
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              </h2>
              <div className="flex flex-col gap-3">
                {list.map((entry) => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => onEdit(entry)}
                    onDelete={() => handleDelete(entry)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}
