import { compareDateOnly, inclusiveCalendarDays, maxDateOnly, minDateOnly } from './working-calendar.rules'

export interface BucketSegmentRatio {
  startRatio: number
  endRatio: number
  isFirst: boolean
  isLast: boolean
}

/**
 * Calendar-day proportional fill inside a time bucket (Month/Week/Day/Quarter).
 * Position uses calendar days — not working days / effort.
 */
export function buildBucketSegment(
  itemStart: string,
  itemEnd: string,
  bucketStart: string,
  bucketEnd: string
): BucketSegmentRatio | null {
  if (compareDateOnly(itemStart, itemEnd) > 0) return null
  if (compareDateOnly(bucketStart, bucketEnd) > 0) return null

  const visibleStart = maxDateOnly(itemStart, bucketStart)
  const visibleEnd = minDateOnly(itemEnd, bucketEnd)
  if (compareDateOnly(visibleStart, visibleEnd) > 0) return null

  const bucketDays = inclusiveCalendarDays(bucketStart, bucketEnd)
  if (bucketDays <= 0) return null

  const startOffset = inclusiveCalendarDays(bucketStart, visibleStart) - 1
  const endOffset = inclusiveCalendarDays(bucketStart, visibleEnd)

  return {
    startRatio: Math.max(0, Math.min(1, startOffset / bucketDays)),
    endRatio: Math.max(0, Math.min(1, endOffset / bucketDays)),
    isFirst: compareDateOnly(visibleStart, itemStart) === 0,
    isLast: compareDateOnly(visibleEnd, itemEnd) === 0,
  }
}
