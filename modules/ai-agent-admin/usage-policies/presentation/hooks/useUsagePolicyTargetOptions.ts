'use client'

import { useCallback, useEffect, useState } from 'react'
import { UsagePolicyTargetType } from '../../domain/enums/usage-policy.enum'
import { eventConfigsApi } from '@/modules/ai-agent-admin/event-configs'
import { agentsApi } from '@/modules/ai-agent-admin/agents'
import { deploymentsApi } from '@/modules/ai-agent-admin/deployments'

export function useUsagePolicyTargetOptions(targetType: UsagePolicyTargetType) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    if (targetType === UsagePolicyTargetType.Global) {
      setOptions([])
      return
    }
    setLoading(true)
    try {
      if (targetType === UsagePolicyTargetType.EventConfig) {
        const result = await eventConfigsApi.listEventConfigs({ page: 0, size: 200 })
        setOptions(
          result.items.map((item) => ({
            value: item.id,
            label: `${item.code} · ${item.name}`,
          }))
        )
      } else if (targetType === UsagePolicyTargetType.Agent) {
        const result = await agentsApi.listAgents({ page: 0, size: 200 })
        setOptions(
          result.items.map((item) => ({
            value: item.id,
            label: `${item.code} · ${item.name}`,
          }))
        )
      } else {
        const result = await deploymentsApi.listDeployments({ page: 0, size: 200 })
        setOptions(
          result.items.map((item) => ({
            value: item.id,
            label: `${item.code} · ${item.name}`,
          }))
        )
      }
    } finally {
      setLoading(false)
    }
  }, [targetType])

  useEffect(() => {
    void load()
  }, [load])

  return { options, loading }
}
