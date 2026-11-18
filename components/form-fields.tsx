import { cn } from '@/lib/utils'

export const inputClass =
  'h-9 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:opacity-50'

export function Field({
  label,
  htmlFor,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  hint?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={htmlFor} className="text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  )
}

export function Pill({
  active,
  onClick,
  children,
  ...rest
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
} & Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onClick'>) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40',
        active
          ? 'border-transparent bg-primary text-primary-foreground'
          : 'border-border bg-card text-muted-foreground hover:text-foreground',
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
