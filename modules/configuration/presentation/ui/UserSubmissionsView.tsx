'use client'

import { Badge, Typography, PageSkeleton, DataTable } from '@/shared/ui'
import { useParams } from 'next/navigation'
import { useUserSubmissions } from '../hooks/useUserSubmissions'

export function UserSubmissionsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { submissions, formNameById, loading, error } = useUserSubmissions(workspaceId)

  if (loading) {
    return <PageSkeleton variant="list" />
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
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="mb-2">
        <Typography as="h1" size="md" weight="medium">
          Submissions
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Form submissions recorded for this workspace.
        </Typography>
      </div>

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="User Submissions"
          rows={submissions}
          rowKey={(submission) => String(submission.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'form',
              header: 'Form',
              cell: (submission) => <>{formNameById(submission.formDefinitionId)}</>,
            },
            {
              id: 'validation',
              header: 'Validation',
              cell: (submission) => (
                <>
                  <Badge
                    variant="solid"
                    tone={submission.validationStatus === 'VALID' ? 'success' : 'warning'}
                  >
                    {submission.validationStatus === 'VALID'
                      ? 'Valid'
                      : submission.validationStatus}
                  </Badge>
                </>
              ),
            },
            {
              id: 'status',
              header: 'Status',
              cell: (submission) => (
                <>
                  <Badge
                    variant="solid"
                    tone={
                      String(submission.status).toUpperCase() === 'ACTIVE' ? 'success' : 'neutral'
                    }
                  >
                    {String(submission.status)
                      .replace(/_/g, ' ')
                      .toLowerCase()
                      .replace(/\b\w/g, (c) => c.toUpperCase())}
                  </Badge>
                </>
              ),
            },
          ]}
        />
      </div>
    </div>
  )
}
