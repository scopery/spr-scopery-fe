'use client'

import { useParams } from 'next/navigation'
import { Link, Typography, PageSkeleton } from '@/shared/ui'
import { useUserForms } from '../hooks/useUserForms'

export function UserFormsView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { forms, loading, error } = useUserForms(workspaceId)

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
          Forms
        </Typography>
        <Typography as="p" variant="small" tone="muted" className="mt-1">
          Fill in the available forms for this workspace.
        </Typography>
      </div>

      {forms.length === 0 ? (
        <div className="border border-dashed border-neutral-300 bg-neutral-50 px-4 py-16 text-center">
          <Typography tone="muted" variant="small">
            No forms are available to submit right now.
          </Typography>
        </div>
      ) : (
        <ul className="divide-y divide-neutral-100 border border-neutral-200 bg-white">
          {forms.map((form) => (
            <li key={form.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <Typography weight="medium" variant="small">
                  {form.name}
                </Typography>
                <Typography variant="small" tone="muted" className="font-mono text-xs">
                  {form.objectTypeCode}
                  {form.formType ? ` · ${form.formType}` : ''}
                </Typography>
              </div>
              <Link href={`/workspace/${workspaceId}/forms/${form.id}`} size="sm">
                Fill in
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
