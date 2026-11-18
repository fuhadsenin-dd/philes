import { createClient } from '@/lib/supabase/server'
import { AuthScreen } from '@/components/auth-screen'
import { AppShell } from '@/components/app-shell'

export default async function Home() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return <AuthScreen />

  const displayName =
    typeof user.user_metadata?.display_name === 'string' && user.user_metadata.display_name
      ? user.user_metadata.display_name
      : null

  return <AppShell email={user.email ?? ''} displayName={displayName} />
}
