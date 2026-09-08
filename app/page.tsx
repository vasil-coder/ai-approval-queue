import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DemoTriggers } from '@/components/demo-triggers'

const STEPS = [
  {
    n: '01',
    title: 'Event arrives',
    body: 'A form submission, ticket, or portal request hits the webhook.',
  },
  {
    n: '02',
    title: 'AI drafts, nothing sends',
    body: 'The model proposes the next action with a confidence score and its reasoning. It stays pending.',
  },
  {
    n: '03',
    title: 'A human decides',
    body: 'An admin edits, approves, or rejects. Only then does anything execute — and the decision is logged.',
  },
]

export default async function LandingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 font-display font-bold tracking-tight"
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

          <nav className="flex items-center gap-3">
            {user ? (
              <Link
                href="/admin/queue"
                className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
              >
                Open queue
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-full border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-subtle"
              >
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 sm:px-6 lg:px-10">
        <section className="max-w-3xl py-16 sm:py-24">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 font-mono text-xs tracking-tight text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            Human-in-the-loop AI
          </span>

          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] sm:text-6xl">
            AI drafts the action.
            <br />
            <span className="text-accent">A human approves it.</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted">
            Most companies won&apos;t let AI touch a customer, because one bad
            send is expensive and untraceable. This is the layer that fixes
            that: every inbound event gets an AI-drafted response with a visible
            confidence score and stated reasoning, but nothing executes until a
            person reviews it. Every approval, edit, and rejection is written to
            an immutable audit log — so you can deploy AI where mistakes cost
            money, and still answer &ldquo;who decided this, and why?&rdquo;
          </p>
        </section>

        <section className="border-t border-border py-14">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="font-display text-2xl font-bold">
                Trigger a demo event
              </h2>
              <p className="mt-2 max-w-xl text-muted">
                Each button posts a realistic payload to the live webhook. The
                model drafts an action, and it lands in the approval queue as
                pending.
              </p>
            </div>
            {!user && (
              <Link
                href="/login"
                className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
              >
                Sign in to review drafts &rarr;
              </Link>
            )}
          </div>

          <div className="mt-8">
            <DemoTriggers />
          </div>
        </section>
      </main>

      <section className="mt-8 bg-space text-space-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-10">
          <h2 className="font-display text-2xl font-bold">How it works</h2>
          <div className="mt-10 grid gap-10 sm:grid-cols-3">
            {STEPS.map((step) => (
              <div key={step.n}>
                <span className="font-mono text-sm text-accent">{step.n}</span>
                <h3 className="mt-3 font-display text-lg font-semibold">
                  {step.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-space-foreground/60">
                  {step.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
