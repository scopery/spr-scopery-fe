import { describe, expect, it } from 'vitest'
import type { TimelineFlatRow } from '../model/timeline'
import {
  applyFillHandle,
  buildShiftPatches,
  collectSelectableSubtreeIds,
  parsePastedTaskLines,
  scheduleInParallel,
  scheduleSequentially,
  shiftRangeByWorkingDays,
  summarizeTimelineSelection,
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

describe('buildShiftPatches', () => {
  it('shifts a selected phase and its scheduled descendants', () => {
    const phase = task('phase', {
      id: 'PHASE:1',
      kind: 'phase',
      itemType: 'PHASE',
      sourceEntityId: 'phase-1',
      depth: 0,
      startDate: '2026-08-03',
      endDate: '2026-08-07',
    })
    const child = task('a', {
      depth: 1,
      startDate: '2026-08-03',
      endDate: '2026-08-04',
    })
    const sibling = task('b', {
      id: 'PHASE:2',
      kind: 'phase',
      itemType: 'PHASE',
      sourceEntityId: 'phase-2',
      depth: 0,
      startDate: '2026-08-10',
      endDate: '2026-08-14',
    })
    const patches = buildShiftPatches([phase, child, sibling], ['PHASE:1'], 1)
    expect(patches).toHaveLength(2)
    expect(patches.find((p) => p.itemId === 'PHASE:1')).toMatchObject({
      startDate: '2026-08-04',
      endDate: '2026-08-10',
    })
    expect(patches.find((p) => p.itemId === 'a')).toMatchObject({
      startDate: '2026-08-04',
      endDate: '2026-08-05',
    })
  })

  it('shifts a selected WBS node without moving an unrelated task', () => {
    const wbs = task('wbs', {
      id: 'WBS:1',
      kind: 'phase',
      itemType: 'WBS_NODE',
      sourceEntityId: 'wbs-1',
      depth: 1,
      startDate: '2026-08-03',
      endDate: '2026-08-06',
    })
    const child = task('a', {
      depth: 2,
      startDate: '2026-08-03',
      endDate: '2026-08-04',
    })
    const other = task('b', {
      depth: 1,
      startDate: '2026-08-03',
      endDate: '2026-08-04',
    })
    const patches = buildShiftPatches([wbs, child, other], ['WBS:1'], -1)
    expect(patches.map((p) => p.itemId).sort()).toEqual(['WBS:1', 'a'])
  })
})

describe('collectSelectableSubtreeIds', () => {
  it('includes a phase and its children', () => {
    const phase = task('phase', {
      id: 'PHASE:1',
      kind: 'phase',
      itemType: 'PHASE',
      depth: 0,
    })
    const child = task('a', { depth: 1 })
    const other = task('b', { depth: 0, kind: 'phase', itemType: 'PHASE', id: 'PHASE:2' })
    expect(collectSelectableSubtreeIds([phase, child, other], 'PHASE:1')).toEqual([
      'PHASE:1',
      'a',
    ])
  })
})

describe('summarizeTimelineSelection', () => {
  it('names phases and tasks', () => {
    expect(
      summarizeTimelineSelection([
        task('phase', { kind: 'phase', itemType: 'PHASE' }),
        task('a'),
      ])
    ).toBe('1 phase · 1 task selected')
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
