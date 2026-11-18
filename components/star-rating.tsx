'use client'

import { Star } from 'lucide-react'
import { cn } from '@/lib/utils'

function Stars({ value, size }: { value: number; size: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => {
        const fill = Math.max(0, Math.min(1, value - (n - 1)))
        return (
          <span key={n} className={cn('relative inline-block', size)}>
            <Star className={cn('absolute inset-0 text-muted-foreground/40', size)} />
            {fill > 0 ? (
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn('fill-accent text-accent', size)} />
              </span>
            ) : null}
          </span>
        )
      })}
    </span>
  )
}

export function StarDisplay({ value }: { value: number | null }) {
  if (value === null) return null
  return (
    <span className="inline-flex items-center gap-1.5">
      <Stars value={value} size="size-3.5" />
      <span className="sr-only">{`Rated ${value} out of 5 stars`}</span>
    </span>
  )
}

export function StarInput({
  id,
  value,
  onChange,
}: {
  id?: string
  value: number
  onChange: (value: number) => void
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Stars value={value} size="size-6" />
        <input
          id={id}
          type="range"
          min={0}
          max={5}
          step={0.5}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          aria-valuetext={value === 0 ? 'No rating' : `${value} out of 5 stars`}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </div>
      <span className="font-mono text-sm text-muted-foreground tabular-nums">
        {value === 0 ? '—' : value.toFixed(1)}
      </span>
      {value > 0 ? (
        <button
          type="button"
          onClick={() => onChange(0)}
          className="text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear
        </button>
      ) : null}
    </div>
  )
}
