'use client'

import { PageSkeleton, Typography } from '@/shared/ui'
import { useAdminSuppressions } from '../hooks/useAdminSuppressions'

export function SuppressionsTab() {
  const { suppressions, loading, error, forbidden } = useAdminSuppressions()

  if (loading && suppressions.length === 0) return <PageSkeleton variant="list" />

  if (forbidden) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography weight="medium">You don&apos;t have access to suppressions</Typography>
      </div>
    )
  }

  if (error) {
    return (
      <div className="border border-neutral-200 bg-white p-8 text-center">
        <Typography tone="error">{error}</Typography>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto border border-neutral-200 bg-white">
      <table className="min-w-full text-left text-sm">
        <thead className="bg-neutral-50 text-neutral-600">
          <tr>
            <th className="px-4 py-3 font-medium">User ID</th>
            <th className="px-4 py-3 font-medium">Channel</th>
            <th className="px-4 py-3 font-medium">Category</th>
            <th className="px-4 py-3 font-medium">Reason</th>
            <th className="px-4 py-3 font-medium">Source</th>
            <th className="px-4 py-3 font-medium">Suppressed At</th>
            <th className="px-4 py-3 font-medium">Expires</th>
          </tr>
        </thead>
        <tbody>
          {suppressions.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-8 text-center">
                <Typography variant="small" tone="muted">No suppressions found</Typography>
              </td>
            </tr>
          ) : (
            suppressions.map((s) => (
              <tr key={s.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                <td className="px-4 py-3 font-mono text-xs text-neutral-500">{s.userId}</td>
                <td className="px-4 py-3 text-neutral-700">{s.channel}</td>
                <td className="px-4 py-3 text-neutral-500">{s.category ?? '—'}</td>
                <td className="px-4 py-3 text-neutral-500">{s.reason}</td>
                <td className="px-4 py-3 text-neutral-500">{s.source}</td>
                <td className="px-4 py-3 text-neutral-500">{s.suppressedAt}</td>
                <td className="px-4 py-3 text-neutral-500">{s.expiresAt ?? '—'}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
