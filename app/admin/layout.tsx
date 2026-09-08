import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { SignOutButton } from '@/components/sign-out-button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-8 gap-y-2 px-4 py-3 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="inline-flex items-center gap-2.5 font-display font-bold tracking-tight"
          >
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-foreground/15 bg-card text-accent">
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4 fill-none stroke-current"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </span>
            AI Approval Queue
          </Link>

          <nav className="flex gap-6 text-sm font-medium">
            <Link
              href="/admin/queue"
              className="text-muted transition-colors hover:text-foreground"
            >
              Queue
            </Link>
            <Link
              href="/admin/audit"
              className="text-muted transition-colors hover:text-foreground"
            >
              Audit log
            </Link>
          </nav>

          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="hidden font-mono text-xs text-muted sm:inline">
              {user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  )
}
