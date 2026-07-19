'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as automationRulesApi from '../../infrastructure/api/automation-rules.api'
import type { ReminderRule, CreateReminderRulePayload } from '../../domain/model/reminder-rule'
import type { AlertRule, CreateAlertRulePayload } from '../../domain/model/alert-rule'
import type { DigestRule, CreateDigestRulePayload } from '../../domain/model/digest-rule'
import type { DigestRun } from '../../domain/model/digest-run'

export function useAutomationRules(workspaceId: string | null) {
  const [reminderRules, setReminderRules] = useState<ReminderRule[]>([])
  const [alertRules, setAlertRules] = useState<AlertRule[]>([])
  const [digestRules, setDigestRules] = useState<DigestRule[]>([])
  const [digestRuns, setDigestRuns] = useState<DigestRun[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const [reminders, alerts, digests, runs] = await Promise.all([
        automationRulesApi.listReminderRules(workspaceId).catch(() => [] as ReminderRule[]),
        automationRulesApi.listAlertRules(workspaceId).catch(() => [] as AlertRule[]),
        automationRulesApi.listDigestRules(workspaceId).catch(() => [] as DigestRule[]),
        automationRulesApi.listDigestRuns(workspaceId).catch(() => [] as DigestRun[]),
      ])
      setReminderRules(reminders ?? [])
      setAlertRules(alerts ?? [])
      setDigestRules(digests ?? [])
      setDigestRuns(runs ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load automation rules')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => { void load() }, [load])

  const createReminderRule = useCallback(
    async (body: CreateReminderRulePayload): Promise<ReminderRule> => {
      if (!workspaceId) throw new Error('workspaceId is required')
      const created = await automationRulesApi.createReminderRule(workspaceId, body)
      await load()
      return created
    },
    [workspaceId, load],
  )

  const createAlertRule = useCallback(
    async (body: CreateAlertRulePayload): Promise<AlertRule> => {
      if (!workspaceId) throw new Error('workspaceId is required')
      const created = await automationRulesApi.createAlertRule(workspaceId, body)
      await load()
      return created
    },
    [workspaceId, load],
  )

  const createDigestRule = useCallback(
    async (body: CreateDigestRulePayload): Promise<DigestRule> => {
      if (!workspaceId) throw new Error('workspaceId is required')
      const created = await automationRulesApi.createDigestRule(workspaceId, body)
      await load()
      return created
    },
    [workspaceId, load],
  )

  return {
    reminderRules,
    alertRules,
    digestRules,
    digestRuns,
    loading,
    error,
    forbidden,
    refetch: load,
    createReminderRule,
    createAlertRule,
    createDigestRule,
  }
}
