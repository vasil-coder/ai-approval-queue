/**
 * Deterministic UTC timestamp.
 *
 * Deliberately not toLocaleString(). Client components get server-rendered
 * too, and a locale or timezone dependent string renders differently on each
 * side, which throws a hydration mismatch on every row.
 */
export function formatTimestamp(ts: string | null | undefined): string {
  if (!ts) return '-'
  const d = new Date(ts)
  if (Number.isNaN(d.getTime())) return '-'
  return `${d.toISOString().replace('T', ' ').slice(0, 16)} UTC`
}

export function formatActionType(type: string | null | undefined): string {
  if (!type) return 'unknown'
  return type.replace(/_/g, ' ')
}
