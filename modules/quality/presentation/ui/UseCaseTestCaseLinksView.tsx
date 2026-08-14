'use client'

import NextLink from 'next/link'
import { useParams, useSearchParams } from 'next/navigation'
import { Button, Typography } from '@/shared/ui'
import { qualityCasesHref } from '../quality-routes'
import { UseCaseTestCaseLinkPanel } from './UseCaseTestCaseLinkPanel'

/** Dedicated full-page Use Case ↔ Test Case linker (not embedded in detail tabs). */
export function UseCaseTestCaseLinksView() {
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const searchParams = useSearchParams()
  const catalogHref = qualityCasesHref(workspaceId, projectId, { type: 'functional' })

  return (
    <div className="flex h-full min-h-0 flex-col bg-white px-3 py-3 lg:px-4 lg:py-3">
      <div className="flex min-h-0 w-full flex-1 flex-col">
        <header className="mb-2 flex items-end justify-between border-b border-neutral-200 pb-2">
          <div>
            <Typography as="h1" size="md" weight="medium">
              Use Case → Test Case
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-0.5">
              Select a Use Case, then drag Test Cases onto the drop zone — same pattern as
              Requirement → Function.
            </Typography>
          </div>
          <Button as={NextLink} href={catalogHref} size="sm" variant="outline">
            Back to catalog
          </Button>
        </header>
        <div className="min-h-0 flex-1">
          <UseCaseTestCaseLinkPanel
            projectId={projectId}
            initialUseCaseId={searchParams.get('useCaseId')}
          />
        </div>
      </div>
    </div>
  )
}
