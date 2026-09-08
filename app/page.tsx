import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { DemoTriggers } from '@/components/demo-triggers'

const STEPS = [
  {
    n: '1',
    title: 'Event arrives',
    body: 'A form submission, ticket, or portal request hits the webhook.',
  },
  {
    n: '2',
    title: 'AI drafts, nothing sends',
    body: 'Claude proposes the next action with a confidence score and its reasoning. It stays pending.',
  },
  {
    n: '3',
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
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <span className="font-semibold tracking-tight">AI Approval Queue</span>
          <nav className="flex items-center gap-4 text-sm">
            {user ? (
              <Link
                href="/admin/queue"
                className="rounded-md bg-blue-600 px-3 py-1.5 font-medium text-white hover:bg-blue-700"
              >
                Open queue
              </Link>
            ) : (
              <Link href="/login" className="text-slate-600 hover:text-slate-900">
                Sign in
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-12 sm:py-20">
        <section className="max-w-2xl">
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            AI drafts the action.
            <br />
            <span className="text-blue-600">A human approves it.</span>
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-600">
            Most companies won&apos;t let AI touch a customer because one bad
            send is expensive and untraceable. This is the layer that fixes
            that: every inbound event gets an AI-drafted response with a visible
            confidence score and stated reasoning, but nothing executes until a
            person reviews it. Every approval, edit, and rejection is written to
            an immutable audit log — so you can deploy AI where mistakes cost
            money, and still answer &ldquo;who decided this, and why?&rdquo;
          </p>
        </section>

        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Try it — trigger a demo event
          </h2>
          <p className="mt-2 text-slate-600">
            Each button posts a realistic payload to the live webhook. Claude
            drafts an action, and it lands in the approval queue as pending.
          </p>
          <div className="mt-6">
            <DemoTriggers />
          </div>
          {!user && (
            <p className="mt-4 text-sm text-slate-500">
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>{' '}
              to review what the AI drafted.
            </p>
          )}
        </section>

        <section className="mt-20 grid gap-8 border-t border-slate-200 pt-10 sm:grid-cols-3">
          {STEPS.map((step) => (
            <div key={step.n}>
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-sm font-medium text-white">
                {step.n}
              </span>
              <h3 className="mt-3 font-medium">{step.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {step.body}
              </p>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}
