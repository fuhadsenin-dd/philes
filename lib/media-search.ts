import type { MediaType } from '@/lib/types'

export interface SearchResult {
  id: string
  mediaType: MediaType
  title: string
  year: string | null
  subtitle: string | null
  coverUrl: string | null
  totalPages: number | null
}

export function searchUrl(type: MediaType, q: string, limit = 8) {
  return `/api/search?type=${type}&q=${encodeURIComponent(q.trim())}&limit=${limit}`
}

export async function fetchSearch(url: string): Promise<SearchResult[]> {
  const res = await fetch(url)
  const json = await res.json()
  if (!res.ok) throw new Error(json.error ?? 'Search failed.')
  return json.results as SearchResult[]
}

export function resultMeta(r: SearchResult) {
  return [r.year, r.subtitle, r.totalPages ? `${r.totalPages} pages` : null].filter(Boolean).join(' · ')
}
