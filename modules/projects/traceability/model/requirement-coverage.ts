import type { CoverageMatrixCell, TraceLink } from '../api/traceability.api'
import type { Requirement } from '@/modules/projects/requirements'
import type { TestCase } from '@/modules/quality'

export const CoverageStatus = {
  Covered: 'covered',
  MissingTests: 'missing_tests',
  AtRisk: 'at_risk',
  NotEvaluated: 'not_evaluated',
} as const
export type CoverageStatus = (typeof CoverageStatus)[keyof typeof CoverageStatus]

export type CoverageQuickFilter =
  | 'all'
  | 'gaps'
  | 'failed'
  | 'blocked'
  | 'failed_or_blocked'
  | 'no_result'
  | 'open_defects'

export interface LinkedTestCaseView {
  id: string
  code: string | null
  title: string
  latestResultLabel: string
}

export interface CoverageDefectView {
  id: string
  code: string | null
  title: string
  status: string | null
}

export interface RequirementCoverageRow {
  requirementId: string
  code: string
  title: string
  reqType: string | null
  moduleName: string | null
  testCases: LinkedTestCaseView[]
  testCaseCount: number
  hasResult: boolean
  hasDefect: boolean
  hasRelease: boolean
  latestResultLabel: string
  defectsLabel: string
  openDefects: CoverageDefectView[]
  targetReleaseLabel: string | null
  coverageStatus: CoverageStatus
  fromReport: boolean
}

export type CoverageNextActionType =
  | 'LINK_TEST_CASE'
  | 'OPEN_NFR'
  | 'START_TEST_RUN'
  | 'REVIEW_FAILURE'
  | 'RESOLVE_BLOCKER'
  | 'VIEW_RESULTS'

export interface CoverageNextAction {
  type: CoverageNextActionType
  label: string
}

export interface CoverageSummary {
  requirements: number
  covered: number
  coveredPct: number
  missingTests: number
  failed: number
  blocked: number
  notEvaluated: number
}

export function coverageStatusLabel(status: CoverageStatus): string {
  switch (status) {
    case CoverageStatus.Covered:
      return 'Covered'
    case CoverageStatus.MissingTests:
      return 'Missing test'
    case CoverageStatus.AtRisk:
      return 'Partial'
    case CoverageStatus.NotEvaluated:
      return 'Not evaluated'
  }
}

export function coverageStatusTone(
  status: CoverageStatus
): 'success' | 'warning' | 'error' | 'neutral' {
  switch (status) {
    case CoverageStatus.Covered:
      return 'success'
    case CoverageStatus.MissingTests:
      return 'error'
    case CoverageStatus.AtRisk:
      return 'warning'
    case CoverageStatus.NotEvaluated:
      return 'neutral'
  }
}

export function coverageNextAction(row: RequirementCoverageRow): CoverageNextAction {
  const requirementType = (row.reqType ?? '').toUpperCase().replace(/-/g, '_')
  if (requirementType === 'NON_FUNCTIONAL' || requirementType === 'NFR') {
    return { type: 'OPEN_NFR', label: 'Review NFR Pipeline' }
  }

  if (row.testCaseCount === 0) {
    return { type: 'LINK_TEST_CASE', label: 'Link Test Case' }
  }

  switch (row.latestResultLabel.toUpperCase()) {
    case 'FAILED':
      return { type: 'REVIEW_FAILURE', label: 'Review Failure' }
    case 'BLOCKED':
      return { type: 'RESOLVE_BLOCKER', label: 'Resolve Blocker' }
    case 'NOT RUN':
    case '—':
      return { type: 'START_TEST_RUN', label: 'Start Test Run' }
    default:
      return { type: 'VIEW_RESULTS', label: 'View Results' }
  }
}

export function deriveCoverageStatus(input: {
  testCaseCount: number
  hasResult: boolean
  hasDefect: boolean
  gap?: boolean
}): CoverageStatus {
  if (input.testCaseCount === 0) return CoverageStatus.MissingTests
  if (input.hasDefect) return CoverageStatus.AtRisk
  if (!input.hasResult) return CoverageStatus.NotEvaluated
  if (input.gap) return CoverageStatus.AtRisk
  return CoverageStatus.Covered
}

export function mapApiCoverageStatus(status: string | null | undefined): CoverageStatus | null {
  if (!status) return null
  switch (status.toUpperCase()) {
    case 'MISSING_TESTS':
      return CoverageStatus.MissingTests
    case 'NOT_EVALUATED':
      return CoverageStatus.NotEvaluated
    case 'AT_RISK':
      return CoverageStatus.AtRisk
    case 'COVERED':
      return CoverageStatus.Covered
    default:
      return null
  }
}

function fallbackLatestResultLabel(input: {
  testCaseCount: number
  hasResult: boolean
  hasDefect: boolean
  status: CoverageStatus
}): string {
  if (input.testCaseCount === 0) return '—'
  if (!input.hasResult) return 'Not run'
  if (input.status === CoverageStatus.AtRisk) {
    return input.hasDefect ? 'Blocked' : 'Failed'
  }
  return 'Passed'
}

export function mapLatestResultLabel(
  latestResult: string | null | undefined,
  fallback: {
    testCaseCount: number
    hasResult: boolean
    hasDefect: boolean
    status: CoverageStatus
  }
): string {
  if (latestResult) {
    switch (latestResult.toUpperCase()) {
      case 'PASSED':
        return 'Passed'
      case 'FAILED':
        return 'Failed'
      case 'BLOCKED':
        return 'Blocked'
      case 'NOT_RUN':
        return 'Not run'
      case 'SKIPPED':
        return 'Skipped'
      default:
        return latestResult
    }
  }
  return fallbackLatestResultLabel(fallback)
}

function isReqToTestLink(link: TraceLink): boolean {
  const src = link.sourceType.toUpperCase()
  const tgt = link.targetType.toUpperCase()
  const type = link.linkType.toUpperCase()
  return (
    src === 'REQUIREMENT' &&
    tgt === 'TEST_CASE' &&
    (type === 'TESTED_BY' || type === 'VERIFIED_BY' || type === 'COVERS')
  )
}

function reqLabel(r: Requirement): { code: string; title: string; reqType: string | null } {
  return {
    code: r.code || '—',
    title: r.title || 'Untitled requirement',
    reqType: (r.req_type ?? r.type ?? null) as string | null,
  }
}

function mapCellToRow(cell: CoverageMatrixCell): RequirementCoverageRow {
  const testCases: LinkedTestCaseView[] = (cell.testCases ?? []).map((tc) => ({
    id: tc.id,
    code: tc.code ?? null,
    title: tc.title,
    latestResultLabel: mapLatestResultLabel(tc.latestResult ?? null, {
      testCaseCount: 1,
      hasResult: Boolean(tc.latestResult && tc.latestResult !== 'NOT_RUN'),
      hasDefect: false,
      status: CoverageStatus.NotEvaluated,
    }),
  }))
  const openDefects: CoverageDefectView[] = (cell.openDefects ?? []).map((d) => ({
    id: d.id,
    code: d.code ?? null,
    title: d.title,
    status: d.status ?? null,
  }))
  const testCaseCount =
    cell.testCaseCount ?? (testCases.length > 0 ? testCases.length : cell.hasTestCase ? 1 : 0)
  const hasResult = cell.hasResult ?? Boolean(cell.latestResult && cell.latestResult !== 'NOT_RUN')
  const hasDefect =
    cell.hasDefect ?? (cell.openDefectCount != null ? cell.openDefectCount > 0 : false)
  const hasRelease = cell.hasRelease ?? cell.targetRelease != null
  const status =
    mapApiCoverageStatus(cell.coverageStatus) ??
    deriveCoverageStatus({
      testCaseCount,
      hasResult,
      hasDefect,
      gap: cell.gap,
    })

  return {
    requirementId: cell.requirementId,
    code: cell.code || cell.requirementCode || '—',
    title: cell.title || cell.requirementTitle || 'Requirement',
    reqType: cell.requirementType ?? null,
    moduleName: cell.moduleName ?? null,
    testCases,
    testCaseCount,
    hasResult,
    hasDefect,
    hasRelease,
    latestResultLabel: mapLatestResultLabel(cell.latestResult, {
      testCaseCount,
      hasResult,
      hasDefect,
      status,
    }),
    defectsLabel:
      cell.openDefectCount != null
        ? cell.openDefectCount > 0
          ? `${cell.openDefectCount} open`
          : '0'
        : hasDefect
          ? 'Open'
          : testCaseCount > 0
            ? '0'
            : '—',
    openDefects,
    targetReleaseLabel: cell.targetRelease?.name ?? null,
    coverageStatus: status,
    fromReport: true,
  }
}

/** Prefer rich BE matrix items when server-computed coverageStatus is present. */
export function mapCoverageMatrixItemsToRows(
  items: CoverageMatrixCell[]
): RequirementCoverageRow[] | null {
  if (items.length === 0) return []
  const rich = items.some(
    (c) => c.coverageStatus != null || c.testCaseCount != null || c.latestResult != null
  )
  if (!rich) return null
  return items.map(mapCellToRow).sort((a, b) => a.code.localeCompare(b.code))
}

export function mapCoverageSummary(
  summary:
    | {
        requirements: number
        covered: number
        coveredPct: number
        missingTests: number
        failed: number
        blocked: number
        notEvaluated?: number
        atRisk?: number
      }
    | null
    | undefined,
  fallbackRows: RequirementCoverageRow[]
): CoverageSummary {
  if (summary) {
    return {
      requirements: summary.requirements,
      covered: summary.covered,
      coveredPct: summary.coveredPct,
      missingTests: summary.missingTests,
      failed: summary.failed,
      blocked: summary.blocked,
      notEvaluated:
        summary.notEvaluated ??
        fallbackRows.filter((r) => r.coverageStatus === CoverageStatus.NotEvaluated).length,
    }
  }
  return summarizeCoverage(fallbackRows)
}

/**
 * Requirements are the row source. Trace links + coverage report enrich each row.
 * When BE returns rich coverageStatus, prefer that matrix and merge any missing requirements.
 */
export function buildRequirementCoverageRows(input: {
  requirements: Requirement[]
  links: TraceLink[]
  cells: CoverageMatrixCell[]
  testCases: TestCase[]
}): RequirementCoverageRow[] {
  const rich = mapCoverageMatrixItemsToRows(input.cells)
  if (rich && input.cells.some((c) => c.coverageStatus != null)) {
    const seen = new Set(rich.map((r) => r.requirementId))
    const extras = input.requirements
      .filter((r) => !seen.has(r.id))
      .map((r) => {
        const { code, title, reqType } = reqLabel(r)
        return {
          requirementId: r.id,
          code,
          title,
          reqType,
          moduleName: null,
          testCases: [] as LinkedTestCaseView[],
          testCaseCount: 0,
          hasResult: false,
          hasDefect: false,
          hasRelease: false,
          latestResultLabel: '—',
          defectsLabel: '—',
          openDefects: [] as CoverageDefectView[],
          targetReleaseLabel: null,
          coverageStatus: CoverageStatus.MissingTests,
          fromReport: false,
        } satisfies RequirementCoverageRow
      })
    return [...rich, ...extras].sort((a, b) => a.code.localeCompare(b.code))
  }

  const testById = new Map(input.testCases.map((t) => [t.id, t]))
  const cellByReq = new Map(input.cells.map((c) => [c.requirementId, c]))

  const linksByReq = new Map<string, TraceLink[]>()
  for (const link of input.links) {
    if (!isReqToTestLink(link)) continue
    const list = linksByReq.get(link.sourceId) ?? []
    list.push(link)
    linksByReq.set(link.sourceId, list)
  }

  const rows: RequirementCoverageRow[] = []
  const seen = new Set<string>()

  for (const req of input.requirements) {
    seen.add(req.id)
    const cell = cellByReq.get(req.id)
    const reqLinks = linksByReq.get(req.id) ?? []
    const testsFromLinks: LinkedTestCaseView[] = reqLinks.map((link) => {
      const tc = testById.get(link.targetId)
      return {
        id: link.targetId,
        code: tc?.code ?? null,
        title: tc?.title ?? 'Unavailable test case',
        latestResultLabel: '—',
      }
    })
    const testsFromCell: LinkedTestCaseView[] = (cell?.testCases ?? []).map((tc) => ({
      id: tc.id,
      code: tc.code ?? null,
      title: tc.title,
      latestResultLabel: mapLatestResultLabel(tc.latestResult ?? null, {
        testCaseCount: 1,
        hasResult: Boolean(tc.latestResult && tc.latestResult !== 'NOT_RUN'),
        hasDefect: false,
        status: CoverageStatus.NotEvaluated,
      }),
    }))
    const tests = testsFromCell.length > 0 ? testsFromCell : testsFromLinks

    const testCaseCount =
      cell?.testCaseCount ?? (tests.length > 0 ? tests.length : cell?.hasTestCase ? 1 : 0)
    const hasResult =
      cell?.hasResult ?? Boolean(cell?.latestResult && cell.latestResult !== 'NOT_RUN')
    const hasDefect =
      cell?.hasDefect ?? (cell?.openDefectCount != null ? cell.openDefectCount > 0 : false)
    const hasRelease = cell?.hasRelease ?? cell?.targetRelease != null
    const status =
      mapApiCoverageStatus(cell?.coverageStatus) ??
      deriveCoverageStatus({
        testCaseCount,
        hasResult: Boolean(hasResult),
        hasDefect: Boolean(hasDefect),
        gap: cell?.gap,
      })

    const { code, title, reqType } = reqLabel(req)
    const openDefects: CoverageDefectView[] = (cell?.openDefects ?? []).map((d) => ({
      id: d.id,
      code: d.code ?? null,
      title: d.title,
      status: d.status ?? null,
    }))

    rows.push({
      requirementId: req.id,
      code: cell?.code || cell?.requirementCode || code,
      title: cell?.title || cell?.requirementTitle || title,
      reqType: cell?.requirementType ?? reqType,
      moduleName: cell?.moduleName ?? null,
      testCases: tests,
      testCaseCount,
      hasResult: Boolean(hasResult),
      hasDefect: Boolean(hasDefect),
      hasRelease: Boolean(hasRelease),
      latestResultLabel: mapLatestResultLabel(cell?.latestResult, {
        testCaseCount,
        hasResult: Boolean(hasResult),
        hasDefect: Boolean(hasDefect),
        status,
      }),
      defectsLabel:
        cell?.openDefectCount != null
          ? cell.openDefectCount > 0
            ? `${cell.openDefectCount} open`
            : '0'
          : hasDefect
            ? 'Open'
            : testCaseCount > 0
              ? '0'
              : '—',
      openDefects,
      targetReleaseLabel: cell?.targetRelease?.name ?? null,
      coverageStatus: status,
      fromReport: Boolean(cell),
    })
  }

  for (const cell of input.cells) {
    if (seen.has(cell.requirementId)) continue
    rows.push(mapCellToRow(cell))
  }

  return rows.sort((a, b) => a.code.localeCompare(b.code))
}

export function summarizeCoverage(rows: RequirementCoverageRow[]): CoverageSummary {
  const requirements = rows.length
  const covered = rows.filter((r) => r.coverageStatus === CoverageStatus.Covered).length
  const missingTests = rows.filter((r) => r.coverageStatus === CoverageStatus.MissingTests).length
  const failed = rows.filter(
    (r) => r.coverageStatus === CoverageStatus.AtRisk && r.hasResult && !r.hasDefect
  ).length
  const blocked = rows.filter((r) => r.hasDefect).length
  const notEvaluated = rows.filter((r) => r.coverageStatus === CoverageStatus.NotEvaluated).length
  return {
    requirements,
    covered,
    coveredPct: requirements === 0 ? 0 : Math.round((covered / requirements) * 100),
    missingTests,
    failed,
    blocked,
    notEvaluated,
  }
}

export function filterCoverageRows(
  rows: RequirementCoverageRow[],
  opts: {
    query: string
    quickFilter: CoverageQuickFilter
  }
): RequirementCoverageRow[] {
  const q = opts.query.trim().toLowerCase()
  return rows.filter((row) => {
    const requirementType = (row.reqType ?? '').toUpperCase().replace(/-/g, '_')
    const isNfr = requirementType === 'NON_FUNCTIONAL' || requirementType === 'NFR'
    if (opts.quickFilter === 'gaps' && isNfr) return false
    if (opts.quickFilter === 'gaps' && row.coverageStatus !== CoverageStatus.MissingTests) {
      return false
    }
    if (opts.quickFilter === 'failed_or_blocked') {
      if (row.coverageStatus !== CoverageStatus.AtRisk && !row.hasDefect) return false
    }
    if (opts.quickFilter === 'failed' && row.latestResultLabel.toUpperCase() !== 'FAILED') {
      return false
    }
    if (opts.quickFilter === 'blocked' && row.latestResultLabel.toUpperCase() !== 'BLOCKED') {
      return false
    }
    if (opts.quickFilter === 'no_result' && row.coverageStatus !== CoverageStatus.NotEvaluated) {
      return false
    }
    if (opts.quickFilter === 'open_defects' && !row.hasDefect) return false

    if (!q) return true
    const hay = [
      row.code,
      row.title,
      row.reqType ?? '',
      row.moduleName ?? '',
      ...row.testCases.map((t) => `${t.code ?? ''} ${t.title}`),
    ]
      .join(' ')
      .toLowerCase()
    return hay.includes(q)
  })
}

export function formatTraceLinkEndpoints(link: TraceLink): {
  source: string
  target: string
} {
  const source =
    [link.sourceCode, link.sourceTitle].filter(Boolean).join(' · ') ||
    `${link.sourceType} · Unavailable`
  const target =
    [link.targetCode, link.targetTitle].filter(Boolean).join(' · ') ||
    `${link.targetType} · Unavailable`
  return { source, target }
}

export function resolveTraceLinkLabel(
  type: string,
  id: string,
  requirements: Requirement[],
  testCases: TestCase[],
  link?: TraceLink
): string {
  if (link?.sourceId === id && (link.sourceCode || link.sourceTitle)) {
    return [link.sourceCode, link.sourceTitle].filter(Boolean).join(' · ') || '—'
  }
  if (link?.targetId === id && (link.targetCode || link.targetTitle)) {
    return [link.targetCode, link.targetTitle].filter(Boolean).join(' · ') || '—'
  }

  const t = type.toUpperCase()
  if (t === 'REQUIREMENT') {
    const r = requirements.find((x) => x.id === id)
    if (r) return [r.code, r.title].filter(Boolean).join(' · ') || '—'
  }
  if (t === 'TEST_CASE') {
    const tc = testCases.find((x) => x.id === id)
    if (tc) return [tc.code, tc.title].filter(Boolean).join(' · ') || '—'
  }
  return `${type} · Unavailable`
}
