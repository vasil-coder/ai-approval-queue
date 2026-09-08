import { Skeleton } from '@/components/skeleton'

// Shown automatically while QueuePage's Supabase query is in flight, on
// first load and on every navigation into /admin/queue. Shape matches the
// real header + ActionCard layout so nothing jumps when the data lands.
export default function QueueLoading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-5 w-32" />
      </div>

      <div className="space-y-5">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border bg-card"
          >
            <div className="grid md:grid-cols-2">
              <div className="border-b border-border p-6 md:border-b-0 md:border-r">
                <div className="flex items-center justify-between gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-4 w-28" />
                </div>
                <Skeleton className="mt-5 h-3 w-28" />
                <Skeleton className="mt-3 h-40 w-full rounded-xl" />
              </div>
              <div className="p-6">
                <Skeleton className="h-6 w-28 rounded-full" />
                <Skeleton className="mt-6 h-3 w-full" />
                <Skeleton className="mt-2 h-1.5 w-full rounded-full" />
                <Skeleton className="mt-5 h-4 w-full" />
                <Skeleton className="mt-2 h-4 w-4/5" />
                <Skeleton className="mt-6 h-3 w-24" />
                <Skeleton className="mt-3 h-28 w-full rounded-xl" />
              </div>
            </div>
            <div className="flex items-center gap-3 border-t border-border bg-subtle px-6 py-4">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
