import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ActionCard } from '@/components/action-card'
import type { QueueAction } from '@/lib/types'

// Approvals must show up immediately, so never serve this from the cache.
export const dynamic = 'force-dynamic'

export default async function QueuePage() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('actions')
    .select(
      `id, action_type, ai_draft, status, created_at, human_edits,
       event:events ( id, source, payload, received_at )`
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  const actions = (data ?? []) as unknown as QueueAction[]

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">
          Pending approvals
        </h1>
        <p className="text-sm text-slate-500">
          {actions.length} awaiting review
        </p>
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          Could not load the queue: {error.message}
        </p>
      )}

      {!error && actions.length === 0 && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <p className="font-medium">Nothing pending</p>
          <p className="mt-1 text-sm text-slate-600">
            Trigger a demo event from the{' '}
            <Link href="/" className="text-blue-600 hover:underline">
              landing page
            </Link>{' '}
            to see the AI draft an action.
          </p>
        </div>
      )}

      <div className="space-y-5">
        {actions.map((action) => (
          <ActionCard key={action.id} action={action} />
        ))}
      </div>
    </div>
  )
}
