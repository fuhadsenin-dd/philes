'use client'

import useSWR from 'swr'
import { createClient } from '@/lib/supabase/client'
import { ENTRY_COLUMNS, WATCHLIST_COLUMNS, type Entry, type WatchlistItem } from '@/lib/types'

async function fetchEntries() {
  const { data, error } = await createClient()
    .from('entries')
    .select(ENTRY_COLUMNS)
    .order('logged_date', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((row) => ({
    ...row,
    rating: row.rating === null ? null : Number(row.rating),
  })) as Entry[]
}

async function fetchWatchlist() {
  const { data, error } = await createClient()
    .from('watchlist_items')
    .select(WATCHLIST_COLUMNS)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as WatchlistItem[]
}

export function useEntries() {
  return useSWR('entries', fetchEntries)
}

export function useWatchlist() {
  return useSWR('watchlist', fetchWatchlist)
}
