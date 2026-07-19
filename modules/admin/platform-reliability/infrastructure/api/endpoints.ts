import { apiPath } from '@/shared/lib/api-paths'
import type { SearchPlatformAuditEventsParams } from '../../domain/model/platform-reliability'

function withQuery(base: string, params?: Record<string, string | number | boolean | undefined>) {
  if (!params) return base
  const p = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') p.set(key, String(value))
  }
  const q = p.toString()
  return q ? `${base}?${q}` : base
}

/** Phase 04 APIs — only wire endpoints that exist on BE today. */
export const PLATFORM_RELIABILITY_ENDPOINTS = {
  auditEvents: {
    search: (params?: SearchPlatformAuditEventsParams) =>
      withQuery(
        apiPath('/iam/audit-events'),
        params as Record<string, string | number | boolean | undefined>
      ),
  },
} as const
