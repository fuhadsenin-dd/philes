import Link from 'next/link'
import { Logo } from '@/components/logo'

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 text-center">
      <Logo />
      <div className="flex max-w-sm flex-col gap-2">
        <h1 className="text-lg font-medium">That link didn&apos;t work</h1>
        <p className="text-sm text-muted-foreground">
          The confirmation link may have expired or already been used. Try signing in, or sign
          up again to get a fresh link.
        </p>
      </div>
      <Link
        href="/"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        Back to philes
      </Link>
    </main>
  )
}
