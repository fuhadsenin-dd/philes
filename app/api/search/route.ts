import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { MediaType } from '@/lib/types'
import type { SearchResult } from '@/lib/media-search'

const REVALIDATE = { next: { revalidate: 3600 } }

interface ITunesItem {
  trackId?: number
  trackName?: string
  artworkUrl100?: string
  releaseDate?: string
  primaryGenreName?: string
}

interface TvMazeHit {
  show?: {
    id: number
    name?: string
    premiered?: string | null
    image?: { medium?: string; original?: string } | null
    network?: { name?: string } | null
    webChannel?: { name?: string } | null
  }
}

interface OpenLibraryDoc {
  key?: string
  title?: string
  cover_i?: number
  number_of_pages_median?: number
  author_name?: string[]
  first_publish_year?: number
}

function yearOf(date?: string | null) {
  return date ? date.slice(0, 4) : null
}

function https(url?: string | null) {
  return url ? url.replace(/^http:\/\//, 'https://') : null
}

interface WikiPage {
  id: number
  title: string
  description?: string | null
  thumbnail?: { url?: string } | null
}

async function searchMoviesWikipedia(q: string, limit: number): Promise<SearchResult[]> {
  const url = new URL('https://en.wikipedia.org/w/rest.php/v1/search/page')
  url.searchParams.set('q', `${q} film`)
  url.searchParams.set('limit', String(Math.min(limit * 2, 20)))
  const res = await fetch(url, {
    ...REVALIDATE,
    headers: { 'User-Agent': 'philes-media-journal/1.0' },
  })
  if (!res.ok) throw new Error(`Wikipedia responded ${res.status}`)
  const json = (await res.json()) as { pages?: WikiPage[] }
  return (json.pages ?? [])
    .filter((p) => /\bfilm\b/i.test(p.description ?? ''))
    .slice(0, limit)
    .map((p) => {
      const thumb = p.thumbnail?.url
      return {
        id: `movie-wiki-${p.id}`,
        mediaType: 'movie' as const,
        title: p.title.replace(/\s*\((?:\d{4} )?(?:[\w-]+ )?film\)$/i, ''),
        year: p.description?.match(/\b(19|20)\d{2}\b/)?.[0] ?? null,
        subtitle: p.description ?? null,
        coverUrl: thumb ? `https:${thumb.replace(/\/\d+px-/, '/400px-')}` : null,
        totalPages: null,
      }
    })
}

async function searchMovies(q: string, limit: number): Promise<SearchResult[]> {
  const fromITunes = await searchMoviesITunes(q, limit).catch((err) => {
    console.error('iTunes movie search failed:', err)
    return []
  })
  if (fromITunes.length > 0) return fromITunes
  return searchMoviesWikipedia(q, limit)
}

async function searchMoviesITunes(q: string, limit: number): Promise<SearchResult[]> {
  const url = new URL('https://itunes.apple.com/search')
  url.searchParams.set('term', q)
  url.searchParams.set('media', 'movie')
  url.searchParams.set('limit', String(limit))
  const res = await fetch(url, REVALIDATE)
  if (!res.ok) throw new Error(`iTunes responded ${res.status}`)
  const json = (await res.json()) as { results?: ITunesItem[] }
  return (json.results ?? [])
    .filter((r) => r.trackName)
    .map((r) => ({
      id: `movie-${r.trackId ?? r.trackName}`,
      mediaType: 'movie' as const,
      title: r.trackName!,
      year: yearOf(r.releaseDate),
      subtitle: r.primaryGenreName ?? null,
      coverUrl: https(r.artworkUrl100?.replace('100x100bb', '600x600bb')),
      totalPages: null,
    }))
}

async function searchShows(q: string, limit: number): Promise<SearchResult[]> {
  const url = new URL('https://api.tvmaze.com/search/shows')
  url.searchParams.set('q', q)
  const res = await fetch(url, REVALIDATE)
  if (!res.ok) throw new Error(`TVMaze responded ${res.status}`)
  const json = (await res.json()) as TvMazeHit[]
  return json
    .filter((h) => h.show?.name)
    .slice(0, limit)
    .map(({ show }) => ({
      id: `show-${show!.id}`,
      mediaType: 'show' as const,
      title: show!.name!,
      year: yearOf(show!.premiered),
      subtitle: show!.network?.name ?? show!.webChannel?.name ?? null,
      coverUrl: https(show!.image?.medium),
      totalPages: null,
    }))
}

async function searchBooks(q: string, limit: number): Promise<SearchResult[]> {
  const url = new URL('https://openlibrary.org/search.json')
  url.searchParams.set('title', q)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('fields', 'key,title,cover_i,number_of_pages_median,author_name,first_publish_year')
  const res = await fetch(url, {
    ...REVALIDATE,
    headers: { 'User-Agent': 'philes-media-journal/1.0' },
  })
  if (!res.ok) throw new Error(`Open Library responded ${res.status}`)
  const json = (await res.json()) as { docs?: OpenLibraryDoc[] }
  return (json.docs ?? [])
    .filter((d) => d.title)
    .map((d) => ({
      id: `book-${d.key ?? d.title}`,
      mediaType: 'book' as const,
      title: d.title!,
      year: d.first_publish_year ? String(d.first_publish_year) : null,
      subtitle: d.author_name?.slice(0, 2).join(', ') ?? null,
      coverUrl: d.cover_i ? `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg` : null,
      totalPages: d.number_of_pages_median ?? null,
    }))
}

const SEARCHERS: Record<MediaType, (q: string, limit: number) => Promise<SearchResult[]>> = {
  movie: searchMovies,
  show: searchShows,
  book: searchBooks,
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const params = request.nextUrl.searchParams
  const type = params.get('type') as MediaType | null
  const q = params.get('q')?.trim()
  const limit = Math.min(Math.max(Number.parseInt(params.get('limit') ?? '8', 10) || 8, 1), 12)

  if (!type || !(type in SEARCHERS)) {
    return NextResponse.json({ error: 'Invalid media type.' }, { status: 400 })
  }
  if (!q || q.length > 200) {
    return NextResponse.json({ error: 'Enter a title first.' }, { status: 400 })
  }

  try {
    const results = await SEARCHERS[type](q, limit)
    return NextResponse.json({ results })
  } catch (err) {
    console.error('Media search failed:', err)
    return NextResponse.json({ error: 'Search is unavailable right now.' }, { status: 502 })
  }
}
