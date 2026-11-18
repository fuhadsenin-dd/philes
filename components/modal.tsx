'use client'

import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const titleId = useId()

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={titleId}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-xl border border-border bg-card p-0 text-card-foreground shadow-2xl backdrop:bg-black/75 backdrop:backdrop-blur-sm"
    >
      <div className="flex max-h-[88svh] flex-col">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 id={titleId} className="text-base font-medium">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" aria-hidden="true" />
            <span className="sr-only">Close</span>
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </dialog>
  )
}
