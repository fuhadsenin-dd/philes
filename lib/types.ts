export type MediaType = 'movie' | 'show' | 'book'
export type EntryStatus = 'completed' | 'in_progress' | 'rewatch'

export interface Entry {
  id: string
  media_type: MediaType
  title: string
  cover_url: string | null
  season: number | null
  episode: number | null
  start_page: number | null
  end_page: number | null
  total_pages: number | null
  rating: number | null
  status: EntryStatus
  notes: string | null
  logged_date: string
  created_at: string
}

export interface WatchlistItem {
  id: string
  media_type: MediaType
  title: string
  cover_url: string | null
  total_pages: number | null
  pitch_note: string | null
  created_at: string
}

export const ENTRY_COLUMNS =
  'id, media_type, title, cover_url, season, episode, start_page, end_page, total_pages, rating, status, notes, logged_date, created_at'

export const WATCHLIST_COLUMNS =
  'id, media_type, title, cover_url, total_pages, pitch_note, created_at'

export const MEDIA_TYPE_LABELS: Record<MediaType, string> = {
  movie: 'Movie',
  show: 'TV Show',
  book: 'Book',
}

export function statusLabel(status: EntryStatus, mediaType: MediaType) {
  if (status === 'completed') return 'Completed'
  if (status === 'in_progress') return 'In Progress'
  return mediaType === 'book' ? 'Reread' : 'Rewatch'
}

export interface LogPrefill {
  id?: string
  media_type?: MediaType
  title?: string
  cover_url?: string | null
  season?: number | null
  episode?: number | null
  start_page?: number | null
  end_page?: number | null
  total_pages?: number | null
  rating?: number | null
  status?: EntryStatus
  notes?: string | null
  logged_date?: string
}
