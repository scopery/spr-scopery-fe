import { describe, expect, it } from 'vitest'
import { FEATURES } from '@/config/features'
import {
  qualityCasesHref,
  qualityDefectsHref,
  qualityRunsHref,
} from './quality-routes'

describe('quality-routes', () => {
  const ws = 'ws-1'
  const projectId = 'p1'

  it('points Cases/Runs/Defects at canonical paths when simplified workflow is on', () => {
    expect(FEATURES.qualitySimplifiedWorkflow).toBe(true)
    expect(qualityCasesHref(ws, projectId, { type: 'functional' })).toContain('/quality/cases')
    expect(qualityCasesHref(ws, projectId, { type: 'nfr' })).toContain('type=nfr')
    expect(qualityRunsHref(ws, projectId, { runId: 'r1' })).toContain('/quality/runs')
    expect(qualityDefectsHref(ws, projectId)).toContain('/quality/defects')
  })
})
