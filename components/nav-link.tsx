'use client'

import Link, { useLinkStatus } from 'next/link'
import type { ComponentProps } from 'react'

/**
 * Must be rendered as a child of <Link> — that's the only place
 * useLinkStatus is allowed to run, and it reports the pending state of
 * that specific link's navigation.
 */
function PendingDot() {
  const { pending } = useLinkStatus()
  if (!pending) return null
  return (
    <span
      aria-hidden="true"
      className="ml-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-current align-middle"
    />
  )
}

/**
 * A Link that shows a small pulsing dot the moment it's clicked, before the
 * next route's loading.tsx has even mounted. Closes the gap between "I
 * clicked this" and "something is happening" on the slower routes.
 */
export function NavLink({ children, ...props }: ComponentProps<typeof Link>) {
  return (
    <Link {...props}>
      {children}
      <PendingDot />
    </Link>
  )
}
