'use client'

import { useCallback, useEffect, useState } from 'react'
import * as objectTypesApi from '../../infrastructure/api/object-types.api'
import * as customFieldsApi from '../../infrastructure/api/custom-fields.api'
import * as formsApi from '../../infrastructure/api/forms.api'
import * as layoutsApi from '../../infrastructure/api/layouts.api'
import * as statusSetsApi from '../../infrastructure/api/status-sets.api'
import * as tagsApi from '../../infrastructure/api/tags.api'
import * as taxonomiesApi from '../../infrastructure/api/taxonomies.api'
import type { ObjectType } from '../../domain/model/object-type'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export interface ConfigurationOverviewCounts {
  customFields: number
  forms: number
  layouts: number
  statusSets: number
  tags: number
  taxonomies: number
}

export function useConfigurationOverview(workspaceId: string | null) {
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([])
  const [counts, setCounts] = useState<ConfigurationOverviewCounts>({
    customFields: 0,
    forms: 0,
    layouts: 0,
    statusSets: 0,
    tags: 0,
    taxonomies: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [types, fields, forms, layouts, statusSets, tags, taxonomies] = await Promise.all([
        objectTypesApi.listObjectTypes(),
        customFieldsApi.listCustomFields(workspaceId),
        formsApi.listForms(workspaceId),
        layoutsApi.listLayouts(workspaceId),
        statusSetsApi.listStatusSets(workspaceId),
        tagsApi.listTags(workspaceId),
        taxonomiesApi.listTaxonomies(workspaceId),
      ])
      setObjectTypes(types)
      setCounts({
        customFields: fields.length,
        forms: forms.length,
        layouts: layouts.length,
        statusSets: statusSets.length,
        tags: tags.length,
        taxonomies: taxonomies.length,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load configuration overview'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  return {
    objectTypes,
    counts,
    loading,
    error,
    refetch: load,
  }
}
