import { cn } from '@/lib/utils'

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 font-semibold tracking-tight', className)}>
      <span
        aria-hidden="true"
        className="flex size-6 items-center justify-center rounded-md bg-primary font-mono text-xs font-bold text-primary-foreground"
      >
        ph
      </span>
      <span className="text-lg">philes</span>
    </span>
  )
}
