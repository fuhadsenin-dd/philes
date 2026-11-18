'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { BookOpen, Film, Loader2, MailCheck, Tv } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Field, inputClass } from '@/components/form-fields'
import { Logo } from '@/components/logo'
import { cn } from '@/lib/utils'

type Mode = 'login' | 'signup'

function authErrorMessage(error: unknown, mode: Mode): string {
  const { code, status } = (error ?? {}) as { code?: string; status?: number }
  if (code === 'email_not_confirmed') return 'Please confirm your email first — check your inbox for the link.'
  if (code === 'over_request_rate_limit' || code === 'over_email_send_rate_limit' || status === 429)
    return 'Too many attempts. Please wait a moment and try again.'
  if (code === 'weak_password') return 'Password is too weak. Use at least 6 characters.'
  if (code === 'email_address_invalid') return 'Please use a valid email address.'
  if (mode === 'login' && code === 'invalid_credentials') return 'Invalid email or password.'
  if (mode === 'signup' && code === 'user_already_exists')
    return 'Could not create an account with those details. Try signing in instead.'
  return 'Something went wrong. Please try again.'
}

export function AuthScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [checkEmail, setCheckEmail] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const supabase = createClient()
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.refresh()
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo:
              process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
            data: displayName.trim() ? { display_name: displayName.trim() } : undefined,
          },
        })
        if (error) throw error
        if (data.session) router.refresh()
        else setCheckEmail(true)
      }
    } catch (err) {
      console.error('Auth error:', err)
      setError(authErrorMessage(err, mode))
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh flex-col">
      <header className="flex items-center px-6 py-5 md:px-10">
        <Logo />
      </header>

      <div className="flex flex-1 flex-col items-center justify-center gap-12 px-6 pb-16 md:flex-row md:gap-20 md:px-10">
        <section className="flex max-w-md flex-col gap-6 text-center md:text-left">
          <div className="flex justify-center gap-2 text-muted-foreground md:justify-start" aria-hidden="true">
            <Film className="size-5" />
            <Tv className="size-5" />
            <BookOpen className="size-5" />
          </div>
          <h1 className="text-balance text-4xl font-semibold tracking-tight md:text-5xl">
            Your personal log for movies, shows, and books.
          </h1>
          <p className="text-pretty leading-relaxed text-muted-foreground">
            Track every film, episode, and page. Rate it, jot down a takeaway, and keep a private
            list of what&apos;s up next. Only you can see your journal.
          </p>
        </section>

        <section className="w-full max-w-sm rounded-xl border border-border bg-card p-6">
          {checkEmail ? (
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <MailCheck className="size-8 text-accent" aria-hidden="true" />
              <h2 className="text-lg font-medium">Check your inbox</h2>
              <p className="text-sm text-muted-foreground">
                We sent a confirmation link to <span className="text-foreground">{email}</span>.
                Confirm it to open your journal.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setCheckEmail(false)
                  setMode('login')
                }}
              >
                Back to sign in
              </Button>
            </div>
          ) : (
            <>
              <div role="tablist" aria-label="Account" className="mb-6 grid grid-cols-2 gap-1 rounded-lg bg-background p-1">
                {(['login', 'signup'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => {
                      setMode(m)
                      setError(null)
                    }}
                    className={cn(
                      'h-8 rounded-md text-sm transition-colors',
                      mode === m ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {m === 'login' ? 'Sign in' : 'Create account'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {mode === 'signup' ? (
                  <Field label="Display name (optional)" htmlFor="display-name">
                    <input
                      id="display-name"
                      className={inputClass}
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      maxLength={60}
                      autoComplete="nickname"
                    />
                  </Field>
                ) : null}
                <Field label="Email" htmlFor="email">
                  <input
                    id="email"
                    type="email"
                    required
                    className={inputClass}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    placeholder="you@email.com"
                  />
                </Field>
                <Field label="Password" htmlFor="password">
                  <input
                    id="password"
                    type="password"
                    required
                    minLength={6}
                    className={inputClass}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  />
                </Field>
                {error ? (
                  <p role="alert" className="text-sm text-destructive">
                    {error}
                  </p>
                ) : null}
                <Button type="submit" size="lg" className="mt-2 w-full" disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
                  {mode === 'login' ? 'Sign in' : 'Create account'}
                </Button>
              </form>
            </>
          )}
        </section>
      </div>
    </main>
  )
}
