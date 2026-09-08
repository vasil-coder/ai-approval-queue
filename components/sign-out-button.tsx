'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()

  async function signOut() {
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-subtle"
    >
      Sign out
    </button>
  )
}
