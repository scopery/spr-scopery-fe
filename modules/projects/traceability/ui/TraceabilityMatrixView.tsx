'use client'

import { useParams } from 'next/navigation'
import {
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'
import { useTraceabilityMatrix } from '../hooks/useTraceability'

export function TraceabilityMatrixView() {
  const { projectId } = useParams<{ projectId: string }>()
  const { cells, links, loading, error } = useTraceabilityMatrix(projectId)

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Traceability Matrix</Typography>
      <Typography tone="muted">
        Coverage across Requirement → Test Case → Result → Defect → Release. Gaps highlighted when
        links are missing.
      </Typography>

      {cells.length === 0 ? (
        <Typography tone="muted">No coverage rows yet.</Typography>
      ) : (
        <div className="overflow-x-auto border border-neutral-200">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50">
              <tr>
                <th className="p-sm font-medium">Requirement</th>
                <th className="p-sm font-medium">Test</th>
                <th className="p-sm font-medium">Result</th>
                <th className="p-sm font-medium">Defect</th>
                <th className="p-sm font-medium">Release</th>
                <th className="p-sm font-medium">Gap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {cells.map((c) => (
                <tr key={c.requirementId} className={c.gap ? 'bg-warning/10' : undefined}>
                  <td className="p-sm">
                    {[c.requirementCode, c.requirementTitle].filter(Boolean).join(' · ') ||
                      c.requirementId}
                  </td>
                  <td className="p-sm">{c.hasTestCase ? '✓' : '—'}</td>
                  <td className="p-sm">{c.hasResult ? '✓' : '—'}</td>
                  <td className="p-sm">{c.hasDefect ? '✓' : '—'}</td>
                  <td className="p-sm">{c.hasRelease ? '✓' : '—'}</td>
                  <td className="p-sm">{c.gap ? 'Gap' : 'OK'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Typography variant="h4">Trace links ({links.length})</Typography>
      {links.length === 0 ? (
        <Typography tone="muted" variant="caption">
          No links.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {links.map((l) => (
            <li key={l.id} className="p-sm text-sm">
              {l.sourceType} → {l.targetType} · {l.linkType}
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
