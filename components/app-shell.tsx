'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Logo } from '@/components/logo'
import { UserMenu } from '@/components/user-menu'
import { JournalTab } from '@/components/journal-tab'
import { UpNextTab } from '@/components/up-next-tab'
import { DiscoverTab } from '@/components/discover-tab'
import { LogModal } from '@/components/log-modal'
import { useEntries, useWatchlist } from '@/lib/use-media-data'
import type { LogPrefill } from '@/lib/types'
import { cn } from '@/lib/utils'

type Tab = 'journal' | 'upnext' | 'discover'

interface LogState {
  key: number
  prefill: LogPrefill | null
  watchlistId: string | null
}

export function AppShell({ email, displayName }: { email: string; displayName: string | null }) {
  const [tab, setTab] = useState<Tab>('journal')
  const [log, setLog] = useState<LogState | null>(null)
  const { mutate: mutateEntries } = useEntries()
  const { mutate: mutateWatchlist } = useWatchlist()

  function openLog(prefill: LogPrefill | null = null, watchlistId: string | null = null) {
    setLog({ key: Date.now(), prefill, watchlistId })
  }

  async function handleSaved() {
    if (log?.watchlistId) {
      const { error } = await createClient().from('watchlist_items').delete().eq('id', log.watchlistId)
      if (error) console.error('Remove from watchlist failed:', error)
      await mutateWatchlist()
    }
    await mutateEntries()
    setLog(null)
  }

  return (
    <div className="min-h-svh">
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between gap-4 px-4 md:px-6">
          <Logo />
          <div className="flex items-center gap-2">
            <Button size="lg" onClick={() => openLog()}>
              <Plus aria-hidden="true" />
              Log Media
            </Button>
            <UserMenu email={email} displayName={displayName} />
          </div>
        </div>
        <div className="mx-auto max-w-5xl px-4 md:px-6">
          <div role="tablist" aria-label="Sections" className="-mb-px flex gap-6">
            {(
              [
                ['journal', 'My Journal'],
                ['upnext', 'Up Next'],
                ['discover', 'Discover'],
              ] as const
            ).map(([id, label]) => (
              <button
                key={id}
                id={`tab-${id}`}
                type="button"
                role="tab"
                aria-selected={tab === id}
                aria-controls={`panel-${id}`}
                onClick={() => setTab(id)}
                className={cn(
                  'border-b-2 pb-3 text-sm transition-colors',
                  tab === id
                    ? 'border-foreground text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground',
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8 md:px-6">
        {tab === 'journal' ? (
          <section id="panel-journal" role="tabpanel" aria-labelledby="tab-journal">
            <JournalTab onEdit={(entry) => openLog(entry)} onLog={() => openLog()} />
          </section>
        ) : tab === 'discover' ? (
          <section id="panel-discover" role="tabpanel" aria-labelledby="tab-discover">
            <DiscoverTab
              onLogNow={(r) =>
                openLog({
                  media_type: r.mediaType,
                  title: r.title,
                  cover_url: r.coverUrl,
                  total_pages: r.mediaType === 'book' ? r.totalPages : null,
                })
              }
            />
          </section>
        ) : (
          <section id="panel-upnext" role="tabpanel" aria-labelledby="tab-upnext">
            <UpNextTab
              onLogNow={(item) =>
                openLog(
                  {
                    media_type: item.media_type,
                    title: item.title,
                    cover_url: item.cover_url,
                    total_pages: item.total_pages,
                  },
                  item.id,
                )
              }
            />
          </section>
        )}
      </main>

      {log ? (
        <LogModal
          key={log.key}
          open
          prefill={log.prefill}
          onClose={() => setLog(null)}
          onSaved={handleSaved}
        />
      ) : null}
    </div>
  )
}
