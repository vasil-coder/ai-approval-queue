import { Skeleton } from '@/components/skeleton'

// Shown while AuditPage fetches the page of rows and resolves actor emails.
// That second step is a per-row admin API call, so this screen is the one
// most worth covering.
export default function AuditLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-5 w-24" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border bg-subtle px-4 py-3">
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-4 py-4">
              <Skeleton className="h-3 w-28 shrink-0" />
              <Skeleton className="h-3 w-32 shrink-0" />
              <Skeleton className="h-3 w-24 shrink-0" />
              <Skeleton className="h-3 w-20 shrink-0" />
              <Skeleton className="h-3 flex-1" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
