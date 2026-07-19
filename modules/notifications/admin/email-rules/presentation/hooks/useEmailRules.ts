'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as emailRulesApi from '../../infrastructure/api/email-rules.api'
import type { CreateEmailRulePayload, EmailRule } from '../../domain/model/email-rule'

export function useEmailRules() {
  const [rules, setRules] = useState<EmailRule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await emailRulesApi.listEmailRules()
      setRules(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load email rules')
      setRules([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { void load() }, [load])

  const runAction = useCallback(
    async (ruleId: string, action: 'activate' | 'deactivate' | 'enable' | 'disable') => {
      setActingId(ruleId)
      try {
        let updated: EmailRule
        if (action === 'activate') updated = await emailRulesApi.activateEmailRule(ruleId)
        else if (action === 'deactivate') updated = await emailRulesApi.deactivateEmailRule(ruleId)
        else if (action === 'enable') updated = await emailRulesApi.enableEmailRule(ruleId)
        else updated = await emailRulesApi.disableEmailRule(ruleId)
        setRules((prev) => prev.map((r) => (r.id === ruleId ? updated : r)))
        return updated
      } finally {
        setActingId(null)
      }
    },
    []
  )

  const create = useCallback(async (body: CreateEmailRulePayload) => {
    const created = await emailRulesApi.createEmailRule(body)
    await load()
    return created
  }, [load])

  const remove = useCallback(async (ruleId: string) => {
    await emailRulesApi.deleteEmailRule(ruleId)
    setRules((prev) => prev.filter((r) => r.id !== ruleId))
  }, [])

  return { rules, loading, error, forbidden, actingId, refetch: load, create, runAction, remove }
}
