'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/functional-catalog.api'
import type {
  AddFunctionalItemAnchorBody,
  BusinessRule,
  CreateBusinessRuleBody,
  FunctionalItemAnchor,
  UpdateBusinessRuleBody,
} from '../model/functional-catalog'

export function useFunctionalItemDetail(
  projectId: string | null,
  functionalItemId: string | null
) {
  const [rules, setRules] = useState<BusinessRule[]>([])
  const [anchors, setAnchors] = useState<FunctionalItemAnchor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !functionalItemId) {
      setRules([])
      setAnchors([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [rulesRes, anchorsRes] = await Promise.all([
        api.listBusinessRules(projectId, functionalItemId),
        api.listAnchors(projectId, functionalItemId),
      ])
      setRules(rulesRes.items ?? [])
      setAnchors(anchorsRes.items ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load functional item details')
    } finally {
      setLoading(false)
    }
  }, [projectId, functionalItemId])

  useEffect(() => {
    void load()
  }, [load])

  const addRule = useCallback(
    async (body: CreateBusinessRuleBody) => {
      if (!projectId || !functionalItemId) return
      await api.createBusinessRule(projectId, functionalItemId, body)
      await load()
    },
    [projectId, functionalItemId, load]
  )

  const updateRule = useCallback(
    async (id: string, body: UpdateBusinessRuleBody) => {
      if (!projectId || !functionalItemId) return
      await api.updateBusinessRule(projectId, functionalItemId, id, body)
      await load()
    },
    [projectId, functionalItemId, load]
  )

  const removeRule = useCallback(
    async (id: string) => {
      if (!projectId || !functionalItemId) return
      await api.deleteBusinessRule(projectId, functionalItemId, id)
      await load()
    },
    [projectId, functionalItemId, load]
  )

  const addAnchor = useCallback(
    async (body: AddFunctionalItemAnchorBody) => {
      if (!projectId || !functionalItemId) return
      await api.addAnchor(projectId, functionalItemId, body)
      await load()
    },
    [projectId, functionalItemId, load]
  )

  const removeAnchor = useCallback(
    async (id: string) => {
      if (!projectId || !functionalItemId) return
      await api.removeAnchor(projectId, functionalItemId, id)
      await load()
    },
    [projectId, functionalItemId, load]
  )

  return {
    rules,
    anchors,
    loading,
    error,
    refetch: load,
    addRule,
    updateRule,
    removeRule,
    addAnchor,
    removeAnchor,
  }
}
