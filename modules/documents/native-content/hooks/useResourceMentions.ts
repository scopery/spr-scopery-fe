'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as mentionApi from '../api/resource-mention.api'
import type { ResolvedResource, ResourceTypeDefinition } from '../model/intelligence'

export function useResourceMentions() {
  const [types, setTypes] = useState<ResourceTypeDefinition[]>([])
  const [loadingTypes, setLoadingTypes] = useState(false)
  const [resourceId, setResourceId] = useState('')
  const [selectedType, setSelectedType] = useState('DOCUMENT')
  const [resolved, setResolved] = useState<ResolvedResource | null>(null)
  const [resolving, setResolving] = useState(false)

  const loadTypes = useCallback(async () => {
    setLoadingTypes(true)
    try {
      const res = await mentionApi.listResourceTypes(true)
      setTypes(res.items)
      if (res.items[0]) setSelectedType((prev) => prev || res.items[0].code)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoadingTypes(false)
    }
  }, [])

  useEffect(() => {
    void loadTypes()
  }, [loadTypes])

  const resolveOne = useCallback(async () => {
    const id = resourceId.trim()
    if (!id || !selectedType) return null
    setResolving(true)
    try {
      const res = await mentionApi.batchResolveResources([
        { resourceType: selectedType, resourceId: id },
      ])
      const item = res.items[0] ?? null
      setResolved(item)
      return item
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      return null
    } finally {
      setResolving(false)
    }
  }, [resourceId, selectedType])

  return {
    types,
    loadingTypes,
    resourceId,
    setResourceId,
    selectedType,
    setSelectedType,
    resolved,
    resolving,
    resolveOne,
    refetchTypes: loadTypes,
  }
}
