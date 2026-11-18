'use client'

import { useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Cover } from '@/components/media-type'
import { fetchSearch, resultMeta, searchUrl, type SearchResult } from '@/lib/media-search'
import type { MediaType } from '@/lib/types'
import { cn } from '@/lib/utils'

export function useFetchInfo(onSelect: (result: SearchResult) => void) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)

  function select(result: SearchResult) {
    setSelectedId(result.id)
    onSelect(result)
  }

  async function lookup(title: string, mediaType: MediaType) {
    if (!title.trim()) {
      setMessage('Enter a title first.')
      setResults([])
      return
    }
    setLoading(true)
    setMessage(null)
    try {
      const found = await fetchSearch(searchUrl(mediaType, title, 5))
      setResults(found)
      if (found.length === 0) {
        setMessage('No matches found.')
        return
      }
      select(found[0])
    } catch (err) {
      setResults([])
      setMessage(err instanceof Error ? err.message : 'Lookup failed.')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setResults([])
    setMessage(null)
    setSelectedId(null)
  }

  return { loading, message, results, selectedId, lookup, select, reset }
}

export function FetchInfoButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  return (
    <Button type="button" variant="outline" size="lg" onClick={onClick} disabled={loading}>
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Sparkles aria-hidden="true" />}
      Fetch Info
    </Button>
  )
}

export function FetchInfoResults({
  results,
  selectedId,
  message,
  onSelect,
}: {
  results: SearchResult[]
  selectedId: string | null
  message: string | null
  onSelect: (result: SearchResult) => void
}) {
  if (!message && results.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      {message ? (
        <p role="status" className="text-xs text-muted-foreground">
          {message}
        </p>
      ) : null}
      {results.length > 0 ? (
        <div role="listbox" aria-label="Matches" className="flex flex-col gap-1 rounded-lg border border-border bg-background p-1">
          {results.map((r) => {
            const active = r.id === selectedId
            return (
              <button
                key={r.id}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onSelect(r)}
                className={cn(
                  'flex items-center gap-3 rounded-md p-1.5 text-left transition-colors',
                  active ? 'bg-secondary' : 'hover:bg-secondary/60',
                )}
              >
                <Cover src={r.coverUrl} title={r.title} type={r.mediaType} className="h-10 w-7" />
                <span className="flex min-w-0 flex-col">
                  <span className="truncate text-sm text-foreground">{r.title}</span>
                  <span className="truncate text-xs text-muted-foreground">{resultMeta(r) || '—'}</span>
                </span>
              </button>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}
