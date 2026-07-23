'use client'

import { useCallback, useEffect, useState } from 'react'
import * as api from '../api/functional-catalog.api'
import type {
  AddFunctionalItemAnchorBody,
  BusinessRule,
  CreateBusinessRuleBody,
  CreateCustomPropertyBody,
  FunctionalItemAnchor,
  FunctionalItemCustomProperty,
  UpdateBusinessRuleBody,
  UpdateCustomPropertyBody,
} from '../model/functional-catalog'

export function useFunctionalItemDetail(
  projectId: string | null,
  functionalItemId: string | null
) {
  const [properties, setProperties] = useState<FunctionalItemCustomProperty[]>([])
  const [rules, setRules] = useState<BusinessRule[]>([])
  const [anchors, setAnchors] = useState<FunctionalItemAnchor[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!projectId || !functionalItemId) {
      setProperties([])
      setRules([])
      setAnchors([])
      return
    }
    setLoading(true)
    setError(null)
    try {
      const [propsRes, rulesRes, anchorsRes] = await Promise.all([
        api.listCustomProperties(projectId, functionalItemId),
        api.listBusinessRules(projectId, functionalItemId),
        api.listAnchors(projectId, functionalItemId),
      ])
      setProperties(propsRes.items ?? [])
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

  const addProperty = useCallback(
    async (body: CreateCustomPropertyBody) => {
      if (!projectId || !functionalItemId) return
      await api.createCustomProperty(projectId, functionalItemId, body)
      await load()
    },
    [projectId, functionalItemId, load]
  )

  const updateProperty = useCallback(
    async (id: string, body: UpdateCustomPropertyBody) => {
      if (!projectId || !functionalItemId) return
      await api.updateCustomProperty(projectId, functionalItemId, id, body)
      await load()
    },
    [projectId, functionalItemId, load]
  )

  const removeProperty = useCallback(
    async (id: string) => {
      if (!projectId || !functionalItemId) return
      await api.deleteCustomProperty(projectId, functionalItemId, id)
      await load()
    },
    [projectId, functionalItemId, load]
  )

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
    properties,
    rules,
    anchors,
    loading,
    error,
    refetch: load,
    addProperty,
    updateProperty,
    removeProperty,
    addRule,
    updateRule,
    removeRule,
    addAnchor,
    removeAnchor,
  }
}
