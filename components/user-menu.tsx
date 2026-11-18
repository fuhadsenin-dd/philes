'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function UserMenu({ email, displayName }: { email: string; displayName: string | null }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const name = displayName ?? email
  const initial = name.charAt(0).toUpperCase() || '?'

  async function logOut() {
    await createClient().auth.signOut()
    router.refresh()
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) setOpen(false)
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') setOpen(false)
      }}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex h-9 items-center gap-2 rounded-lg border border-border bg-card pr-2 pl-1 text-sm transition-colors hover:bg-secondary"
      >
        <span className="flex size-7 items-center justify-center rounded-md bg-secondary font-mono text-xs" aria-hidden="true">
          {initial}
        </span>
        <span className="hidden max-w-40 truncate sm:inline">{name}</span>
        <span className="sr-only sm:hidden">Account menu</span>
        <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden="true" />
      </button>
      {open ? (
        <div role="menu" className="absolute right-0 z-20 mt-2 w-60 rounded-lg border border-border bg-popover p-1 shadow-xl">
          <div className="px-3 py-2">
            {displayName ? <p className="truncate text-sm font-medium">{displayName}</p> : null}
            <p className="truncate text-xs text-muted-foreground">{email}</p>
          </div>
          <div className="my-1 h-px bg-border" />
          <button
            type="button"
            role="menuitem"
            onClick={logOut}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Log out
          </button>
        </div>
      ) : null}
    </div>
  )
}
