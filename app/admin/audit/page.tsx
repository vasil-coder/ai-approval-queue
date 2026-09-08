import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { formatTimestamp } from '@/lib/format'

export const dynamic = 'force-dynamic'

const PAGE_SIZE = 50

type AuditRow = {
  id: string
  ts: string | null
  actor_id: string | null
  action: string
  entity: string
  entity_id: string | null
  metadata: Record<string, unknown> | null
}

/**
 * auth.users isn't exposed through PostgREST, so actor emails can't be
 * joined in the main query. Fetch them separately with the admin client
 * and map by id instead.
 */
async function fetchActorEmails(
  actorIds: string[]
): Promise<Record<string, string>> {
  const unique = [...new Set(actorIds)]
  if (unique.length === 0) return {}

  const admin = createAdminClient()
  const emails: Record<string, string> = {}

  await Promise.all(
    unique.map(async (id) => {
      const { data } = await admin.auth.admin.getUserById(id)
      if (data.user?.email) emails[id] = data.user.email
    })
  )

  return emails
}

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>
}) {
  const { page: pageParam } = await searchParams
  const page = Math.max(1, Number(pageParam) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  const {
    data,
    error,
    count,
  } = await supabase
    .from('audit_log')
    .select('id, ts, actor_id, action, entity, entity_id, metadata', {
      count: 'exact',
    })
    .order('ts', { ascending: false })
    .range(from, to)

  const rows = (data ?? []) as AuditRow[]
  const total = count ?? 0
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  const actorEmails = await fetchActorEmails(
    rows.map((r) => r.actor_id).filter((id): id is string => Boolean(id))
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 className="font-display text-3xl font-bold">Audit log</h1>
        <p className="font-mono text-sm text-muted">{total} entries</p>
      </div>

      {error && (
        <p className="rounded-2xl border border-border bg-danger-subtle px-4 py-3 text-sm text-danger">
          Could not load the audit log: {error.message}
        </p>
      )}

      {!error && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
          <p className="font-display text-lg font-semibold">No entries yet</p>
          <p className="mt-2 text-sm text-muted">
            Approve or reject something in the{' '}
            <Link href="/admin/queue" className="text-accent transition-colors hover:text-accent-hover">
              queue
            </Link>{' '}
            and it shows up here.
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-subtle text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Timestamp</th>
                <th className="px-4 py-3 font-medium">Actor</th>
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Entity</th>
                <th className="px-4 py-3 font-medium">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted">
                    {formatTimestamp(row.ts)}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    {row.actor_id ? actorEmails[row.actor_id] ?? row.actor_id : '-'}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-accent">
                    {row.action}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-muted">
                    {row.entity}
                    {row.entity_id && (
                      <span className="ml-1 font-mono text-xs text-muted/60">
                        {row.entity_id.slice(0, 8)}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-muted">
                    {row.metadata ? JSON.stringify(row.metadata) : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <Link
            href={`/admin/audit?page=${page - 1}`}
            aria-disabled={page <= 1}
            className={`rounded-full border px-4 py-2 font-medium transition-colors ${
              page <= 1
                ? 'pointer-events-none border-border text-muted/40'
                : 'border-border hover:bg-subtle'
            }`}
          >
            Previous
          </Link>
          <span className="font-mono text-muted">
            Page {page} of {totalPages}
          </span>
          <Link
            href={`/admin/audit?page=${page + 1}`}
            aria-disabled={page >= totalPages}
            className={`rounded-full border px-4 py-2 font-medium transition-colors ${
              page >= totalPages
                ? 'pointer-events-none border-border text-muted/40'
                : 'border-border hover:bg-subtle'
            }`}
          >
            Next
          </Link>
        </div>
      )}
    </div>
  )
}
