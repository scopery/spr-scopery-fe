import { describe, expect, it } from 'vitest'
import type { TimelineFlatRow } from '../model/timeline'
import {
  applyFillHandle,
  parsePastedTaskLines,
  scheduleInParallel,
  scheduleSequentially,
  shiftRangeByWorkingDays,
} from './timeline-bulk.rules'

function task(
  id: string,
  opts: Partial<TimelineFlatRow> = {}
): TimelineFlatRow {
  return {
    id,
    kind: 'task',
    depth: 1,
    title: id,
    displayPrimary: id,
    displaySecondary: null,
    phaseCode: null,
    itemType: 'TASK',
    sourceEntityId: `src-${id}`,
    phaseId: 'phase-1',
    parentPhaseSourceId: 'phase-1',
    scheduleStatus: 'SCHEDULED',
    assigneeUserId: null,
    estimateHours: 16,
    status: 'TODO',
    progressPercent: null,
    atRisk: false,
    startDate: null,
    endDate: null,
    ...opts,
  }
}

describe('scheduleSequentially', () => {
  it('places tasks back-to-back on working days', () => {
    const patches = scheduleSequentially(
      [task('a'), task('b')],
      '2026-08-03' // Monday
    )
    expect(patches[0]).toMatchObject({
      startDate: '2026-08-03',
      endDate: '2026-08-04',
    })
    expect(patches[1]).toMatchObject({
      startDate: '2026-08-05',
      endDate: '2026-08-06',
    })
  })
})

describe('scheduleInParallel', () => {
  it('shares the same start', () => {
    const patches = scheduleInParallel([task('a'), task('b')], '2026-08-03')
    expect(patches[0].startDate).toBe('2026-08-03')
    expect(patches[1].startDate).toBe('2026-08-03')
  })
})

describe('shiftRangeByWorkingDays', () => {
  it('shifts Mon–Tue by +3 working days to Thu–Fri', () => {
    const next = shiftRangeByWorkingDays('2026-08-03', '2026-08-04', 3)
    expect(next).toEqual({ startDate: '2026-08-06', endDate: '2026-08-07' })
  })
})

describe('applyFillHandle', () => {
  it('copies dates', () => {
    const source = task('a', { startDate: '2026-08-03', endDate: '2026-08-05' })
    const patches = applyFillHandle(source, [task('b')], 'copy')
    expect(patches[0]).toMatchObject({
      startDate: '2026-08-03',
      endDate: '2026-08-05',
    })
  })
})

describe('parsePastedTaskLines', () => {
  it('parses plain lines and TSV', () => {
    expect(parsePastedTaskLines('A\nB').map((x) => x.title)).toEqual(['A', 'B'])
    expect(
      parsePastedTaskLines('Build\t2026-08-03\t2026-08-05\t2d')[0]
    ).toMatchObject({
      title: 'Build',
      startDate: '2026-08-03',
      endDate: '2026-08-05',
      estimateRaw: '2d',
    })
  })
})
