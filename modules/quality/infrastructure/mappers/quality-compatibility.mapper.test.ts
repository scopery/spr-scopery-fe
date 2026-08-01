import { describe, expect, it } from 'vitest'
import {
  buildCompatOverview,
  mapQualityPlanToSettings,
  mapReleaseToReadinessDetail,
  mapTestCaseToCaseRow,
  mapTestRunResultToExecutionRow,
  mapVerificationCaseToCaseRow,
} from './quality-compatibility.mapper'
import type { QualityPlan, ReleasePackage, TestCase, VerificationCase } from '../../domain/model/quality'

describe('quality-compatibility.mapper', () => {
  it('maps functional test cases into CaseRow', () => {
    const tc = {
      id: 'tc1',
      projectId: 'p1',
      code: 'TC-1',
      title: 'Login',
      status: 'APPROVED',
      priority: 'HIGH',
      useCaseId: 'uc1',
      latestResult: 'PASSED',
      latestResultAt: '2026-01-01',
    } satisfies TestCase
    const row = mapTestCaseToCaseRow(tc)
    expect(row.kind).toBe('FUNCTIONAL')
    expect(row.status).toBe('READY')
    expect(row.latestResult?.result).toBe('PASSED')
  })

  it('maps verification cases into NFR CaseRow', () => {
    const vc = {
      id: 'vc1',
      projectId: 'p1',
      requirementId: 'req1',
      title: 'Latency',
      verificationMethod: 'LOAD_TEST',
      lifecycleStatus: 'READY',
      environment: 'staging',
    } satisfies VerificationCase
    const row = mapVerificationCaseToCaseRow(vc)
    expect(row.kind).toBe('NFR')
    expect(row.environment).toBe('staging')
  })

  it('maps quality plan into settings defaults', () => {
    const plan = {
      id: 'qp1',
      projectId: 'p1',
      name: 'Default',
      status: 'CURRENT',
    } satisfies QualityPlan
    const settings = mapQualityPlanToSettings(plan, 'p1')
    expect(settings.sourceQualityPlanId).toBe('qp1')
    expect(settings.releaseGates.requireNoOpenBlockers).toBe(true)
  })

  it('maps release readiness from legacy status', () => {
    const release = {
      id: 'r1',
      projectId: 'p1',
      code: 'REL-1',
      name: '1.0',
      status: 'READY_FOR_RELEASE',
    } satisfies ReleasePackage
    expect(mapReleaseToReadinessDetail(release).readinessStatus).toBe('READY')
  })

  it('resolves caseId from nested testCase when top-level testCaseId is missing', () => {
    const row = mapTestRunResultToExecutionRow({
      id: 'r1',
      testRunId: 'run1',
      resultStatus: 'NOT_RUN',
      testCase: { id: 'tc-nested', code: 'TC-9', title: 'Nested' },
    })
    expect(row.caseId).toBe('tc-nested')
    expect(row.caseCode).toBe('TC-9')
  })

  it('builds compat overview metrics with deep-link targets', () => {
    const overview = buildCompatOverview({
      projectId: 'p1',
      functionalCaseCount: 12,
      nfrCaseCount: 4,
      recentRuns: [],
      openCriticalDefects: 2,
    })
    expect(overview.metrics[0]?.filterParams?.type).toBe('functional')
    expect(overview.metrics.find((m) => m.key === 'critical_defects')?.value).toBe(2)
  })
})
