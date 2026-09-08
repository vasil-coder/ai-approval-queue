'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export function SignOutButton() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function signOut() {
    setPending(true)
    await createClient().auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <button
      onClick={signOut}
      disabled={pending}
      className="rounded-full border border-border px-3.5 py-1.5 text-sm font-medium transition-colors hover:bg-subtle disabled:opacity-50"
    >
      {pending ? 'Signing out…' : 'Sign out'}
    </button>
  )
}
