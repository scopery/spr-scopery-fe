import { describe, expect, it } from 'vitest'
import {
  CoverageStatus,
  buildRequirementCoverageRows,
  deriveCoverageStatus,
  filterCoverageRows,
  summarizeCoverage,
} from './requirement-coverage'
import type { Requirement } from '@/modules/projects/requirements/model/requirements'

const req = (id: string, code: string, title: string): Requirement => ({
  id,
  project_id: 'p1',
  code,
  title,
  parent_id: null,
  description: null,
  created_at: '2026-01-01',
})

describe('deriveCoverageStatus', () => {
  it('maps missing / not evaluated / at risk / covered', () => {
    expect(deriveCoverageStatus({ testCaseCount: 0, hasResult: false, hasDefect: false }))
      .toBe(CoverageStatus.MissingTests)
    expect(deriveCoverageStatus({ testCaseCount: 2, hasResult: false, hasDefect: false }))
      .toBe(CoverageStatus.NotEvaluated)
    expect(deriveCoverageStatus({ testCaseCount: 2, hasResult: true, hasDefect: true }))
      .toBe(CoverageStatus.AtRisk)
    expect(deriveCoverageStatus({ testCaseCount: 2, hasResult: true, hasDefect: false, gap: true }))
      .toBe(CoverageStatus.AtRisk)
    expect(deriveCoverageStatus({ testCaseCount: 2, hasResult: true, hasDefect: false }))
      .toBe(CoverageStatus.Covered)
  })
})

describe('buildRequirementCoverageRows', () => {
  it('creates a row for every requirement even without links', () => {
    const rows = buildRequirementCoverageRows({
      requirements: [req('r1', 'FR-01', 'Login'), req('r2', 'FR-02', 'Reset')],
      links: [],
      cells: [],
      testCases: [],
    })
    expect(rows).toHaveLength(2)
    expect(rows.every((r) => r.coverageStatus === CoverageStatus.MissingTests)).toBe(true)
  })

  it('enriches from TESTED_BY links and coverage cell', () => {
    const rows = buildRequirementCoverageRows({
      requirements: [req('r1', 'FR-01', 'Login')],
      links: [
        {
          id: 'l1',
          sourceType: 'REQUIREMENT',
          sourceId: 'r1',
          targetType: 'TEST_CASE',
          targetId: 't1',
          linkType: 'TESTED_BY',
        },
      ],
      cells: [
        {
          requirementId: 'r1',
          hasTestCase: true,
          hasResult: true,
          hasDefect: false,
          gap: false,
        },
      ],
      testCases: [
        {
          id: 't1',
          projectId: 'p1',
          code: 'TC-01',
          title: 'Valid login',
          status: 'ACTIVE',
        },
      ],
    })
    expect(rows[0].testCaseCount).toBe(1)
    expect(rows[0].testCases[0].code).toBe('TC-01')
    expect(rows[0].coverageStatus).toBe(CoverageStatus.Covered)
    expect(rows[0].latestResultLabel).toBe('Passed')
  })
})

describe('summarizeCoverage + filterCoverageRows', () => {
  it('summarizes and filters gaps', () => {
    const rows = buildRequirementCoverageRows({
      requirements: [req('r1', 'FR-01', 'A'), req('r2', 'FR-02', 'B')],
      links: [
        {
          id: 'l1',
          sourceType: 'REQUIREMENT',
          sourceId: 'r1',
          targetType: 'TEST_CASE',
          targetId: 't1',
          linkType: 'TESTED_BY',
        },
      ],
      cells: [
        {
          requirementId: 'r1',
          hasTestCase: true,
          hasResult: true,
          gap: false,
        },
      ],
      testCases: [{ id: 't1', projectId: 'p1', title: 'T', status: 'ACTIVE' }],
    })
    const summary = summarizeCoverage(rows)
    expect(summary.requirements).toBe(2)
    expect(summary.covered).toBe(1)
    expect(summary.missingTests).toBe(1)
    expect(filterCoverageRows(rows, { query: '', quickFilter: 'gaps' })).toHaveLength(1)
  })
})
