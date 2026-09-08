'use client'

import { useState, useTransition } from 'react'
import { decideAction, saveEdits } from '@/app/admin/queue/actions'
import { formatActionType, formatTimestamp } from '@/lib/format'
import type { QueueAction } from '@/lib/types'

export function ActionCard({ action }: { action: QueueAction }) {
  const draft = action.ai_draft
  const storedBody = action.human_edits?.body ?? draft.draft_content.body ?? ''

  const [body, setBody] = useState(storedBody)
  const [savedBody, setSavedBody] = useState(storedBody)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const isDirty = body !== savedBody
  const confidencePct = Math.round(draft.confidence * 100)

  function run(fn: () => Promise<{ ok: boolean; error?: string }>) {
    setError(null)
    startTransition(async () => {
      const result = await fn()
      if (!result.ok) setError(result.error ?? 'Something went wrong.')
    })
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="grid md:grid-cols-2">
        {/* LEFT: the event that came in */}
        <div className="border-b border-border p-6 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded-full border border-border bg-subtle px-2.5 py-0.5 font-mono text-xs text-muted">
              {action.event?.source ?? 'unknown source'}
            </span>
            <time className="font-mono text-xs text-muted">
              {formatTimestamp(action.event?.received_at ?? action.created_at)}
            </time>
          </div>

          <h3 className="mt-5 text-xs font-medium uppercase tracking-wider text-muted">
            Original event
          </h3>
          <pre className="mt-3 max-h-72 overflow-auto rounded-xl border border-border bg-subtle p-4 font-mono text-xs leading-relaxed">
            {JSON.stringify(action.event?.payload ?? {}, null, 2)}
          </pre>
        </div>

        {/* RIGHT: what the AI wants to do about it */}
        <div className="p-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-accent-foreground">
              {formatActionType(draft.action_type)}
            </span>
            {action.human_edits?.body && (
              <span className="rounded-full border border-border bg-subtle px-2.5 py-1 text-xs font-medium text-muted">
                edited
              </span>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted">
              <span>AI confidence</span>
              <span className="font-mono font-medium text-foreground">
                {confidencePct}%
              </span>
            </div>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-subtle">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>

          <p className="mt-5 text-sm leading-relaxed text-muted">
            <span className="font-medium text-foreground">Reasoning: </span>
            {draft.reasoning}
          </p>

          {(draft.draft_content.to || draft.draft_content.subject) && (
            <dl className="mt-5 space-y-1.5 text-xs">
              {draft.draft_content.to && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-muted">To</dt>
                  <dd className="truncate font-mono text-foreground">
                    {draft.draft_content.to}
                  </dd>
                </div>
              )}
              {draft.draft_content.subject && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-muted">Subject</dt>
                  <dd className="text-foreground">
                    {draft.draft_content.subject}
                  </dd>
                </div>
              )}
              {draft.draft_content.amount != null && (
                <div className="flex gap-2">
                  <dt className="w-16 shrink-0 text-muted">Amount</dt>
                  <dd className="font-mono text-foreground">
                    ${draft.draft_content.amount}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <label
            htmlFor={`draft-${action.id}`}
            className="mt-6 block text-xs font-medium uppercase tracking-wider text-muted"
          >
            Drafted content
          </label>
          <textarea
            id={`draft-${action.id}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="mt-3 w-full resize-y rounded-xl border border-border bg-background p-4 font-mono text-xs leading-relaxed outline-none transition-colors focus:border-accent focus:ring-1 focus:ring-accent"
          />
        </div>
      </div>

      {error && (
        <p className="border-t border-border bg-danger-subtle px-6 py-2.5 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-border bg-subtle px-6 py-4">
        <button
          onClick={() => run(() => decideAction(action.id, 'approved'))}
          disabled={pending}
          className="rounded-full bg-success px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-success-hover disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => run(() => decideAction(action.id, 'rejected'))}
          disabled={pending}
          className="rounded-full border border-danger/30 px-6 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger-subtle disabled:opacity-50"
        >
          Reject
        </button>

        {isDirty && (
          <button
            onClick={() =>
              run(async () => {
                const result = await saveEdits(action.id, body)
                if (result.ok) setSavedBody(body)
                return result
              })
            }
            disabled={pending}
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-50"
          >
            Save edits
          </button>
        )}

        {pending && <span className="text-sm text-muted">Working…</span>}
        {!pending && isDirty && (
          <span className="text-sm text-accent">Unsaved changes</span>
        )}
      </div>
    </article>
  )
}
