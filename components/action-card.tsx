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
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div className="grid md:grid-cols-2">
        {/* LEFT — the inbound event */}
        <div className="border-b border-slate-200 p-5 md:border-b-0 md:border-r">
          <div className="flex items-center justify-between gap-2">
            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-700">
              {action.event?.source ?? 'unknown source'}
            </span>
            <time className="text-xs text-slate-500">
              {formatTimestamp(action.event?.received_at ?? action.created_at)}
            </time>
          </div>

          <h3 className="mt-4 text-sm font-medium text-slate-500">
            Original event
          </h3>
          <pre className="mt-2 max-h-72 overflow-auto rounded-md bg-slate-50 p-3 font-mono text-xs leading-relaxed text-slate-800">
            {JSON.stringify(action.event?.payload ?? {}, null, 2)}
          </pre>
        </div>

        {/* RIGHT — what the AI proposes */}
        <div className="p-5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
              {formatActionType(draft.action_type)}
            </span>
            {action.human_edits?.body && (
              <span className="rounded bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                edited
              </span>
            )}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>AI confidence</span>
              <span className="font-medium text-slate-900">
                {confidencePct}%
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-blue-600"
                style={{ width: `${confidencePct}%` }}
              />
            </div>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-slate-600">
            <span className="font-medium text-slate-900">Reasoning: </span>
            {draft.reasoning}
          </p>

          {(draft.draft_content.to || draft.draft_content.subject) && (
            <dl className="mt-4 space-y-1 text-xs">
              {draft.draft_content.to && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-slate-500">To</dt>
                  <dd className="truncate font-mono text-slate-800">
                    {draft.draft_content.to}
                  </dd>
                </div>
              )}
              {draft.draft_content.subject && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-slate-500">Subject</dt>
                  <dd className="text-slate-800">
                    {draft.draft_content.subject}
                  </dd>
                </div>
              )}
              {draft.draft_content.amount != null && (
                <div className="flex gap-2">
                  <dt className="w-14 shrink-0 text-slate-500">Amount</dt>
                  <dd className="font-mono text-slate-800">
                    ${draft.draft_content.amount}
                  </dd>
                </div>
              )}
            </dl>
          )}

          <label
            htmlFor={`draft-${action.id}`}
            className="mt-4 block text-sm font-medium text-slate-500"
          >
            Drafted content
          </label>
          <textarea
            id={`draft-${action.id}`}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="mt-2 w-full resize-y rounded-md border border-slate-300 p-3 font-mono text-xs leading-relaxed outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {error && (
        <p className="border-t border-red-100 bg-red-50 px-5 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3">
        <button
          onClick={() => run(() => decideAction(action.id, 'approved'))}
          disabled={pending}
          className="rounded-md bg-green-600 px-5 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          Approve
        </button>
        <button
          onClick={() => run(() => decideAction(action.id, 'rejected'))}
          disabled={pending}
          className="rounded-md bg-red-600 px-5 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
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
            className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50"
          >
            Save edits
          </button>
        )}

        {pending && <span className="text-sm text-slate-500">Working…</span>}
        {!pending && isDirty && (
          <span className="text-sm text-amber-700">Unsaved changes</span>
        )}
      </div>
    </article>
  )
}
