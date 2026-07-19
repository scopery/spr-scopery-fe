'use client'

import { useCallback, useEffect, useState } from 'react'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import * as platformApi from '../../infrastructure/api/platform-reliability.api'
import type {
  PlatformHealthStatus,
  PlatformOverviewMetric,
} from '../../domain/model/platform-reliability'

export function usePlatformOverview() {
  const [metrics, setMetrics] = useState<PlatformOverviewMetric[]>([])
  const [health, setHealth] = useState<PlatformHealthStatus>('UNKNOWN')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const audit = await platformApi.searchPlatformAuditEvents({ page: 0, size: 1 })
      const next: PlatformOverviewMetric[] = [
        {
          id: 'audit',
          label: 'Security audits',
          value: audit.totalElements,
          href: ADMIN_ROUTES.platformAuditEvents,
          tone: 'success',
          available: true,
        },
        {
          id: 'activity',
          label: 'Activity logs',
          value: null,
          href: ADMIN_ROUTES.platformActivityLogs,
          tone: 'neutral',
          available: false,
          note: 'Admin list API not available yet',
        },
        {
          id: 'outbox',
          label: 'Event outbox',
          value: null,
          href: ADMIN_ROUTES.platformEventOutbox,
          tone: 'neutral',
          available: false,
          note: 'Generic outbox admin API not available yet',
        },
        {
          id: 'email',
          label: 'Email outbox',
          value: null,
          href: ADMIN_ROUTES.platformEmailOutbox,
          tone: 'neutral',
          available: true,
          note: 'Open queue in Đợt 2',
        },
        {
          id: 'traces',
          label: 'Traces',
          value: null,
          href: ADMIN_ROUTES.platformTraces,
          tone: 'neutral',
          available: false,
          note: 'Coming in Đợt 1 stub',
        },
        {
          id: 'errors',
          label: 'Errors',
          value: null,
          href: ADMIN_ROUTES.platformErrors,
          tone: 'neutral',
          available: false,
          note: 'Coming in Đợt 1 stub',
        },
      ]
      setMetrics(next)
      setHealth(audit.totalElements >= 0 ? 'HEALTHY' : 'UNKNOWN')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load overview')
      setHealth('UNKNOWN')
      setMetrics([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  return { metrics, health, loading, error, refetch: load }
}
