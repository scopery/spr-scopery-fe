'use client'

import { Badge, Typography, PageSkeleton } from '@/shared/ui'
import { useParams } from 'next/navigation'
import { useUserSubmissions } from '../hooks/useUserSubmissions'

export function UserSubmissionsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { submissions, formNameById, loading, error } = useUserSubmissions(workspaceId)

  if (loading) {
    return (
      <PageSkeleton variant="list" />
    )
  }

  if (error) {
    return (
      <div className="border border-red-200 bg-red-50 p-4">
        <Typography variant="small" className="text-red-700">
          {error}
        </Typography>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <Typography as="h1" size="lg" weight="semibold">
          Submissions
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Form submissions recorded for this workspace.
        </Typography>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-3 py-2 font-medium">Form</th>
              <th className="px-3 py-2 font-medium">Validation</th>
              <th className="px-3 py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {submissions.map((submission) => (
              <tr key={submission.id} className="border-t border-neutral-100">
                <td className="px-3 py-2">{formNameById(submission.formDefinitionId)}</td>
                <td className="px-3 py-2">
                  <Badge
                    variant="solid"
                    tone={submission.validationStatus === 'VALID' ? 'success' : 'warning'}
                  >
                    {submission.validationStatus === 'VALID' ? 'Valid' : submission.validationStatus}
                  </Badge>
                </td>
                <td className="px-3 py-2">
                  <Badge
                    variant="solid"
                    tone={String(submission.status).toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'}
                  >
                    {String(submission.status)
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </td>
              </tr>
            ))}
            {submissions.length === 0 ? (
              <tr>
                <td colSpan={3} className="px-3 py-10 text-center text-neutral-500">
                  No submissions yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  )
}
