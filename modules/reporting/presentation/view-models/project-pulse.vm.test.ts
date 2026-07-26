import { describe, expect, it } from 'vitest'
import { ProjectHealthStatus } from '../../domain/enums/project-health.enum'
import { normalizeProjectHealthStatus } from '../../domain/rules/project-pulse.rules'
import { mapProjectPulseViewModel } from './project-pulse.vm'

const routes = {
  overview: '/overview',
  wbs: '/wbs',
  work: '/work',
  schedule: '/schedule',
  timeline: '/timeline',
  estimation: '/estimation',
  resources: '/resources',
  baselines: '/baselines',
  changeRequests: '/crs',
  raid: '/raid',
  financials: '/financials',
  quality: '/quality',
  traceability: '/traceability',
  functionalCatalog: '/functions',
  capacity: '/capacity',
  recommendations: '/recommendations',
}

describe('normalizeProjectHealthStatus', () => {
  it('never returns UNKNOWN and maps common aliases', () => {
    expect(normalizeProjectHealthStatus('UNKNOWN')).toBe(
      ProjectHealthStatus.InsufficientData
    )
    expect(normalizeProjectHealthStatus('ON_TRACK')).toBe(ProjectHealthStatus.OnTrack)
    expect(normalizeProjectHealthStatus('at risk')).toBe(ProjectHealthStatus.AtRisk)
  })
})

describe('mapProjectPulseViewModel', () => {
  it('hides raw report fields and synthesizes attention + finance mask', () => {
    const pulse = mapProjectPulseViewModel({
      dashboard: {
        project: { id: 'p1', code: 'DEMO', name: 'Demo Project', status: 'ACTIVE' },
        health: { status: 'UNKNOWN' },
        taskRisk: {
          totalTasks: 10,
          completedTasks: 4,
          overdueTasks: 3,
          blockedTasks: 1,
          atRiskTasks: 2,
          tasksWithoutEstimate: 2,
        },
        baseline: { hasCurrentBaseline: false },
        changeRequests: { count: 2 },
        finance: { available: false, detailsRedacted: true, reason: 'No finance access' },
      },
      healthPayload: null,
      kpisPayload: null,
      attentionPayload: null,
      reports: {
        capacity: { peakUtilizationPercent: 118 },
        'change-impact': { scheduleImpactDays: 6 },
        finance: { budget: 1 },
      },
      activity: [
        {
          id: '1',
          summary: 'CR-024 impact analysis completed',
          createdAt: new Date().toISOString(),
        },
      ],
      routes,
      period: 'last_7_days',
      lastVisit: null,
      baselineName: null,
      baselineCreatedAt: null,
      recommendations: [],
    })

    expect(pulse.brief.health).toBe(ProjectHealthStatus.InsufficientData)
    expect(pulse.brief.healthLabel).toBe('Insufficient data')
    expect(pulse.attention.some((a) => a.title.includes('overdue'))).toBe(true)
    expect(pulse.financials.permission).toBe('MASKED')
    expect(pulse.financials.reason).toContain('finance')
    expect(pulse.activity[0]?.href).toBe('/crs')
    expect(pulse.setup.show).toBe(true)
    expect(pulse.changeSince.periodLabel).toBe('Last 7 days')
    expect(pulse.aiReview.available).toBe(true)
  })
})
