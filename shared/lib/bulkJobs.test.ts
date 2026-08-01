import { describe, expect, it } from 'vitest'
import {
  BULK_ASYNC_THRESHOLD,
  BULK_MAX_ITEMS,
  BulkJobStatus,
  assertBulkItemCount,
  buildFailedItemsImportPayload,
  bulkJobProgressPercent,
  formatBulkJobFailuresReport,
  isBulkJobTerminal,
  stripNullishDeep,
  type BulkJobResponse,
} from './bulkJobs'

describe('bulkJobs helpers', () => {
  it('computes progress from succeeded+failed over total', () => {
    expect(
      bulkJobProgressPercent({
        succeededItems: 37,
        failedItems: 2,
        totalItems: 100,
      })
    ).toBe(39)
    expect(
      bulkJobProgressPercent({
        succeededItems: 0,
        failedItems: 0,
        totalItems: 0,
      })
    ).toBe(0)
  })

  it('recognizes terminal statuses', () => {
    expect(isBulkJobTerminal(BulkJobStatus.Succeeded)).toBe(true)
    expect(isBulkJobTerminal(BulkJobStatus.Partial)).toBe(true)
    expect(isBulkJobTerminal(BulkJobStatus.Failed)).toBe(true)
    expect(isBulkJobTerminal(BulkJobStatus.Queued)).toBe(false)
    expect(isBulkJobTerminal(BulkJobStatus.Running)).toBe(false)
  })

  it('enforces max 500 items and async threshold constant', () => {
    expect(BULK_MAX_ITEMS).toBe(500)
    expect(BULK_ASYNC_THRESHOLD).toBe(50)
    expect(() => assertBulkItemCount(0)).toThrow(/at least one/i)
    expect(() => assertBulkItemCount(501)).toThrow(/500/)
    expect(() => assertBulkItemCount(3)).not.toThrow()
  })

  it('strips nullish keys for clean re-import JSON', () => {
    expect(stripNullishDeep({ key: 'UC-1', goal: null, nested: { a: 1, b: undefined } })).toEqual({
      key: 'UC-1',
      nested: { a: 1 },
    })
  })

  it('builds failed-items import payload from job.failures', () => {
    const job: BulkJobResponse = {
      id: 'j1',
      jobType: 'BULK_CREATE_USE_CASE',
      status: BulkJobStatus.Partial,
      totalItems: 2,
      succeededItems: 1,
      failedItems: 1,
      resultSummary: '1 created, 1 failed',
      errorMessage: null,
      createdAt: '',
      updatedAt: '',
      failures: [
        {
          index: 1,
          identity: 'UC-DUPTEST-A',
          errorCode: 'DUPLICATE_KEY',
          message: 'Use case key already exists: UC-DUPTEST-A',
          item: {
            key: 'UC-DUPTEST-A',
            name: 'Dup',
            goal: null,
            primaryActorName: 'User',
          },
        },
      ],
    }
    expect(buildFailedItemsImportPayload(job)).toEqual({
      items: [{ key: 'UC-DUPTEST-A', name: 'Dup', primaryActorName: 'User' }],
    })
    expect(formatBulkJobFailuresReport(job)).toContain('UC-DUPTEST-A')
    expect(formatBulkJobFailuresReport(job)).toContain('DUPLICATE_KEY')
  })
})
