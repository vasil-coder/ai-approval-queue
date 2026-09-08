'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Mode = 'login' | 'signup'

export function AuthForm({ mode, next }: { mode: Mode; next?: string }) {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const isLogin = mode === 'login'

  // Only allow same-app redirects — never trust ?next= from the URL bar.
  const destination = next?.startsWith('/admin') ? next : '/admin/queue'

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setNotice(null)

    const supabase = createClient()

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
    } else {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }
      // Email confirmation is on: no session yet, so there's nowhere to go.
      if (!data.session) {
        setNotice(
          'Account created. Check your email for a confirmation link, then sign in.'
        )
        setLoading(false)
        return
      }
    }

    router.push(destination)
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm text-muted transition-colors hover:text-foreground"
        >
          &larr; AI Approval Queue
        </Link>

        <h1 className="font-display text-3xl font-bold">
          {isLogin ? 'Sign in' : 'Create an account'}
        </h1>
        <p className="mt-3 text-muted">
          {isLogin
            ? 'Access the approval queue and audit log.'
            : 'New accounts are granted the admin role.'}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-card px-3.5 py-2.5 outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-danger-subtle px-3.5 py-2.5 text-sm text-danger">
              {error}
            </p>
          )}
          {notice && (
            <p className="rounded-xl bg-subtle px-3.5 py-2.5 text-sm text-foreground">
              {notice}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary px-4 py-3 font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            {loading ? 'Working…' : isLogin ? 'Sign in' : 'Create account'}
          </button>
        </form>

        <p className="mt-8 text-sm text-muted">
          {isLogin ? (
            <>
              No account?{' '}
              <Link
                href="/signup"
                className="font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Sign up
              </Link>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <Link
                href="/login"
                className="font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Sign in
              </Link>
            </>
          )}
        </p>
      </div>
    </main>
  )
}
