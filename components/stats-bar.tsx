import { BookOpen, Film, Flame, Tv } from 'lucide-react'
import { currentStreak } from '@/lib/dates'
import type { Entry } from '@/lib/types'

export function computeStats(entries: Entry[]) {
  let movies = 0
  let episodes = 0
  let pages = 0
  for (const e of entries) {
    if (e.media_type === 'movie' && e.status !== 'in_progress') movies += 1
    if (e.media_type === 'show') episodes += 1
    if (e.media_type === 'book' && e.start_page !== null && e.end_page !== null && e.end_page > e.start_page) {
      pages += e.end_page - e.start_page
    }
  }
  return { movies, episodes, pages, streak: currentStreak(entries.map((e) => e.logged_date)) }
}

export function StatsBar({ entries }: { entries: Entry[] }) {
  const { movies, episodes, pages, streak } = computeStats(entries)
  const stats = [
    { label: 'Movies Completed', value: movies, icon: Film },
    { label: 'Episodes Watched', value: episodes, icon: Tv },
    { label: 'Total Pages Read', value: pages, icon: BookOpen },
    { label: 'Daily Streak', value: streak, icon: Flame, suffix: streak === 1 ? 'day' : 'days' },
  ]

  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-xl border border-border bg-border md:grid-cols-4 [&>div]:bg-card gap-px">
      {stats.map(({ label, value, icon: Icon, suffix }) => (
        <div key={label} className="flex flex-col gap-2 p-4">
          <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </dt>
          <dd className="flex items-baseline gap-1">
            <span className="font-mono text-2xl font-medium tabular-nums">{value.toLocaleString()}</span>
            {suffix ? <span className="text-xs text-muted-foreground">{suffix}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  )
}
