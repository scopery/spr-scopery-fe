import { FEATURES } from '@/config/features'
import { ROUTES } from '@/constants/routes'

/** Canonical Quality destinations — respect simplified workflow flag. */
export function qualityCasesHref(
  workspaceId: string,
  projectId: string,
  opts?: { type?: 'functional' | 'nfr'; selected?: string; query?: string }
): string {
  if (FEATURES.qualitySimplifiedWorkflow) {
    const base = ROUTES.workspace.projectQualityCases(workspaceId, projectId, {
      type: opts?.type,
      selected: opts?.selected,
    })
    if (!opts?.query) return base
    return `${base}${base.includes('?') ? '&' : '?'}${opts.query.replace(/^\?/, '')}`
  }
  const legacy =
    opts?.type === 'nfr'
      ? ROUTES.workspace.projectVerificationCases(workspaceId, projectId)
      : ROUTES.workspace.projectTestCases(workspaceId, projectId)
  return opts?.query ? `${legacy}?${opts.query.replace(/^\?/, '')}` : legacy
}

export function qualityRunsHref(
  workspaceId: string,
  projectId: string,
  opts?: { runId?: string }
): string {
  if (FEATURES.qualitySimplifiedWorkflow) {
    return ROUTES.workspace.projectQualityRuns(workspaceId, projectId, opts)
  }
  const base = ROUTES.workspace.projectTestRuns(workspaceId, projectId)
  return opts?.runId ? `${base}?runId=${encodeURIComponent(opts.runId)}` : base
}

export function qualityDefectsHref(workspaceId: string, projectId: string): string {
  return FEATURES.qualitySimplifiedWorkflow
    ? ROUTES.workspace.projectQualityDefects(workspaceId, projectId)
    : ROUTES.workspace.projectDefects(workspaceId, projectId)
}

export function qualityReleasesHref(workspaceId: string, projectId: string): string {
  return FEATURES.qualitySimplifiedWorkflow
    ? ROUTES.workspace.projectQualityReleases(workspaceId, projectId)
    : ROUTES.workspace.projectReleases(workspaceId, projectId)
}

export function qualityCaseLinksHref(
  workspaceId: string,
  projectId: string,
  useCaseId?: string
): string {
  if (FEATURES.qualitySimplifiedWorkflow) {
    return ROUTES.workspace.projectQualityCaseLinks(workspaceId, projectId, useCaseId)
  }
  return ROUTES.workspace.projectTestCaseLinks(workspaceId, projectId, useCaseId)
}
