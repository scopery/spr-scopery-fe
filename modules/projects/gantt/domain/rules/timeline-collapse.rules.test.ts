import { describe, expect, it } from 'vitest'
import { TimelineCollapseMode } from '../enums/timeline.enum'
import { nextCollapseMode } from './timeline-collapse.rules'

describe('nextCollapseMode', () => {
  it('cycles Expand → Structure → Project → Expand', () => {
    expect(nextCollapseMode(TimelineCollapseMode.Expand)).toBe(
      TimelineCollapseMode.Structure
    )
    expect(nextCollapseMode(TimelineCollapseMode.Structure)).toBe(
      TimelineCollapseMode.Project
    )
    expect(nextCollapseMode(TimelineCollapseMode.Project)).toBe(
      TimelineCollapseMode.Expand
    )
  })
})
