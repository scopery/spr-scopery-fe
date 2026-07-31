'use client'

import { useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { FEATURES } from '@/config/features'
import { ROUTES } from '@/constants/routes'
import { PageSkeleton } from '@/shared/ui'

export type LegacyQualityRedirectTarget =
  | 'overview'
  | 'cases-functional'
  | 'cases-nfr'
  | 'runs'
  | 'defects'
  | 'releases'

/**
 * When qualitySimplifiedWorkflow is on, send legacy Quality URLs to canonical
 * pages while preserving useful query params.
 */
export function LegacyQualityRedirect({
  target,
  children,
}: {
  target: LegacyQualityRedirectTarget
  children: React.ReactNode
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { workspaceId, projectId } = useParams<{ workspaceId: string; projectId: string }>()
  const enabled = FEATURES.qualitySimplifiedWorkflow

  useEffect(() => {
    if (!enabled || !workspaceId || !projectId) return
    const preserve = searchParams?.toString() ?? ''
    const withPreserve = (href: string) => (preserve ? `${href}${href.includes('?') ? '&' : '?'}${preserve}` : href)

    switch (target) {
      case 'overview':
        router.replace(ROUTES.workspace.projectQuality(workspaceId, projectId))
        break
      case 'cases-functional':
        router.replace(
          withPreserve(
            ROUTES.workspace.projectQualityCases(workspaceId, projectId, { type: 'functional' })
          )
        )
        break
      case 'cases-nfr':
        router.replace(
          withPreserve(
            ROUTES.workspace.projectQualityCases(workspaceId, projectId, { type: 'nfr' })
          )
        )
        break
      case 'runs':
        router.replace(withPreserve(ROUTES.workspace.projectQualityRuns(workspaceId, projectId)))
        break
      case 'defects':
        router.replace(
          withPreserve(ROUTES.workspace.projectQualityDefects(workspaceId, projectId))
        )
        break
      case 'releases':
        router.replace(
          withPreserve(ROUTES.workspace.projectQualityReleases(workspaceId, projectId))
        )
        break
    }
  }, [enabled, workspaceId, projectId, router, searchParams, target])

  if (enabled) return <PageSkeleton />
  return <>{children}</>
}
