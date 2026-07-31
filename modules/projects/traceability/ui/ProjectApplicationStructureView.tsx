'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { Select, Typography } from '@/shared/ui'
import { ROUTES } from '@/constants/routes'
import { useApplicationRegistry } from '../hooks/useTraceability'
import { OverallStructurePanel } from './OverallStructurePanel'

export function ProjectApplicationStructureView() {
  const { workspaceId, projectId } = useParams<{
    workspaceId: string
    projectId: string
  }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { items: applications, loading } = useApplicationRegistry(workspaceId)
  const paramAppId = searchParams.get('applicationId')
  const [applicationId, setApplicationId] = useState<string | null>(paramAppId)

  useEffect(() => {
    if (paramAppId) {
      setApplicationId(paramAppId)
      return
    }
    if (!applicationId && applications.length === 1) {
      setApplicationId(applications[0].id)
    }
  }, [paramAppId, applications, applicationId])

  useEffect(() => {
    if (!applicationId || !workspaceId || !projectId) return
    if (paramAppId === applicationId) return
    const href = ROUTES.workspace.projectApplicationStructure(workspaceId, projectId, applicationId)
    router.replace(href)
  }, [applicationId, workspaceId, projectId, paramAppId, router])

  const appOptions = useMemo(
    () => [
      { value: '', label: loading ? 'Loading applications…' : 'Select application…' },
      ...applications.map((a) => ({
        value: a.id,
        label: a.name || a.code || 'Unnamed application',
      })),
    ],
    [applications, loading]
  )

  return (
    <div className="flex h-[calc(100vh-4rem)] min-h-[480px] flex-col px-3 py-3 lg:px-4 lg:py-3">
      <div className="shrink-0 border-b border-neutral-100 pb-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <Typography as="h1" size="md" weight="medium">
              Application Structure
            </Typography>
            <Typography variant="caption" tone="muted" className="mt-0.5">
              Map Project Functions and NFRs onto Application architecture.
            </Typography>
          </div>
          <div className="min-w-[14rem]">
            <Select
              value={applicationId ?? ''}
              onValueChange={(v: string) => setApplicationId(v || null)}
              options={appOptions}
              placeholder="Application"
              aria-label="Application"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        {applicationId ? (
          <OverallStructurePanel
            workspaceId={workspaceId}
            applicationId={applicationId}
            lockedProjectId={projectId}
            showProjectSelector={false}
            showModeSwitcher
          />
        ) : (
          <div className="flex h-full items-center justify-center p-8 text-center">
            <Typography variant="small" tone="muted">
              Select an Application to view and assign structure.
            </Typography>
          </div>
        )}
      </div>
    </div>
  )
}
