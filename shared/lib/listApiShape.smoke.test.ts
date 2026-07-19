/**
 * Offline smoke: BE returns bare arrays (ApiResponse unwrap) → FE list APIs
 * must always expose `{ items: T[] }` so views never crash on `.items.map`.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const get = vi.fn()

vi.mock('@/shared/lib/apiClient', () => ({
  apiClient: {
    get: (...args: unknown[]) => get(...args),
    post: vi.fn(),
    patch: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('list API response shape smoke (bare array from BE)', () => {
  beforeEach(() => {
    get.mockReset()
    get.mockResolvedValue([{ id: '1', name: 'x', title: 'x', status: 'ACTIVE' }])
  })

  it('productivity work inbox', async () => {
    const api = await import('@/modules/productivity/infrastructure/api/productivity.api')
    const res = await api.listWorkInbox('ws1')
    expect(Array.isArray(res.items)).toBe(true)
    expect(res.items).toHaveLength(1)
  })

  it('integration connections + credentials', async () => {
    const api = await import('@/modules/integration-hub/infrastructure/api/integration.api')
    const conn = await api.listConnections('ws1')
    const cred = await api.listCredentialReferences('ws1')
    expect(conn.items).toHaveLength(1)
    expect(cred.items).toHaveLength(1)
  })

  it('support cases + incidents', async () => {
    const api = await import('@/modules/service-support/infrastructure/api/support.api')
    const cases = await api.listSupportCases('ws1')
    const incidents = await api.listIncidents('ws1')
    expect(cases.items).toHaveLength(1)
    expect(incidents.items).toHaveLength(1)
  })

  it('trust privacy + legal holds', async () => {
    const api = await import('@/modules/trust/infrastructure/api/trust.api')
    const privacy = await api.listPrivacyRequests('ws1')
    const holds = await api.listLegalHolds('ws1')
    expect(privacy.items).toHaveLength(1)
    expect(holds.items).toHaveLength(1)
  })

  it('traceability applications + links', async () => {
    const api = await import('@/modules/projects/traceability/api/traceability.api')
    const apps = await api.listApplications('ws1')
    const links = await api.listTraceLinks('p1')
    expect(apps.items).toHaveLength(1)
    expect(links.items).toHaveLength(1)
  })

  it('quality defects + releases', async () => {
    const api = await import('@/modules/quality/infrastructure/api/quality.api')
    const defects = await api.listDefects('p1')
    const releases = await api.listReleases('p1')
    expect(defects.items).toHaveLength(1)
    expect(releases.items).toHaveLength(1)
  })

  it('returns empty items when BE payload is undefined', async () => {
    get.mockResolvedValueOnce(undefined)
    const api = await import('@/modules/productivity/infrastructure/api/productivity.api')
    const res = await api.listWorkInbox('ws1')
    expect(res.items).toEqual([])
  })
})
