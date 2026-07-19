'use client'

import { useCallback, useEffect, useState } from 'react'
import * as objectTypesApi from '../../infrastructure/api/object-types.api'
import * as layoutsApi from '../../infrastructure/api/layouts.api'
import * as statusSetsApi from '../../infrastructure/api/status-sets.api'
import * as tagsApi from '../../infrastructure/api/tags.api'
import * as taxonomiesApi from '../../infrastructure/api/taxonomies.api'
import type { ObjectType } from '../../domain/model/object-type'
import type { CreateLayoutPayload, LayoutDefinition } from '../../domain/model/layout'
import type {
  CreateStatusSetPayload,
  CreateStatusValuePayload,
  StatusSet,
  StatusValue,
} from '../../domain/model/status-set'
import type { CreateTagPayload, TagDefinition } from '../../domain/model/tag'
import type {
  CreateTaxonomyPayload,
  CreateTaxonomyTermPayload,
  Taxonomy,
  TaxonomyTerm,
} from '../../domain/model/taxonomy'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useUiMetadata(workspaceId: string | null) {
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([])
  const [layouts, setLayouts] = useState<LayoutDefinition[]>([])
  const [statusSets, setStatusSets] = useState<StatusSet[]>([])
  const [tags, setTags] = useState<TagDefinition[]>([])
  const [taxonomies, setTaxonomies] = useState<Taxonomy[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [selectedStatusSetId, setSelectedStatusSetId] = useState<string | null>(null)
  const [statusValues, setStatusValues] = useState<StatusValue[]>([])
  const [statusValuesLoading, setStatusValuesLoading] = useState(false)

  const [selectedTaxonomyId, setSelectedTaxonomyId] = useState<string | null>(null)
  const [taxonomyTerms, setTaxonomyTerms] = useState<TaxonomyTerm[]>([])
  const [taxonomyTermsLoading, setTaxonomyTermsLoading] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const [types, layoutList, statusSetList, tagList, taxonomyList] = await Promise.all([
        objectTypesApi.listObjectTypes(),
        layoutsApi.listLayouts(workspaceId),
        statusSetsApi.listStatusSets(workspaceId),
        tagsApi.listTags(workspaceId),
        taxonomiesApi.listTaxonomies(workspaceId),
      ])
      setObjectTypes(types)
      setLayouts(layoutList)
      setStatusSets(statusSetList)
      setTags(tagList)
      setTaxonomies(taxonomyList)
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load UI metadata'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const loadStatusValues = useCallback(
    async (setId: string) => {
      if (!workspaceId) return
      setStatusValuesLoading(true)
      try {
        const values = await statusSetsApi.listStatusValues(workspaceId, setId)
        setStatusValues(values)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setStatusValuesLoading(false)
      }
    },
    [workspaceId]
  )

  useEffect(() => {
    if (selectedStatusSetId) {
      void loadStatusValues(selectedStatusSetId)
    } else {
      setStatusValues([])
    }
  }, [selectedStatusSetId, loadStatusValues])

  const loadTaxonomyTerms = useCallback(
    async (taxonomyId: string) => {
      if (!workspaceId) return
      setTaxonomyTermsLoading(true)
      try {
        const terms = await taxonomiesApi.listTaxonomyTerms(workspaceId, taxonomyId)
        setTaxonomyTerms(terms)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setTaxonomyTermsLoading(false)
      }
    },
    [workspaceId]
  )

  useEffect(() => {
    if (selectedTaxonomyId) {
      void loadTaxonomyTerms(selectedTaxonomyId)
    } else {
      setTaxonomyTerms([])
    }
  }, [selectedTaxonomyId, loadTaxonomyTerms])

  const createLayout = useCallback(
    async (payload: CreateLayoutPayload) => {
      if (!workspaceId) return
      try {
        const created = await layoutsApi.createLayout(workspaceId, payload)
        toast.success('Layout created')
        await load()
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, load]
  )

  const publishLayout = useCallback(
    async (layoutId: string) => {
      if (!workspaceId) return
      try {
        await layoutsApi.publishLayout(workspaceId, layoutId)
        toast.success('Layout published')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, load]
  )

  const createStatusSet = useCallback(
    async (payload: CreateStatusSetPayload) => {
      if (!workspaceId) return
      try {
        const created = await statusSetsApi.createStatusSet(workspaceId, payload)
        toast.success('Status set created')
        await load()
        setSelectedStatusSetId(created.id)
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, load]
  )

  const createStatusValue = useCallback(
    async (setId: string, payload: CreateStatusValuePayload) => {
      if (!workspaceId) return
      try {
        await statusSetsApi.createStatusValue(workspaceId, setId, payload)
        toast.success('Status value added')
        await loadStatusValues(setId)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, loadStatusValues]
  )

  const createTag = useCallback(
    async (payload: CreateTagPayload) => {
      if (!workspaceId) return
      try {
        const created = await tagsApi.createTag(workspaceId, payload)
        toast.success('Tag created')
        await load()
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, load]
  )

  const createTaxonomy = useCallback(
    async (payload: CreateTaxonomyPayload) => {
      if (!workspaceId) return
      try {
        const created = await taxonomiesApi.createTaxonomy(workspaceId, payload)
        toast.success('Taxonomy created')
        await load()
        setSelectedTaxonomyId(created.id)
        return created
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, load]
  )

  const createTaxonomyTerm = useCallback(
    async (taxonomyId: string, payload: CreateTaxonomyTermPayload) => {
      if (!workspaceId) return
      try {
        await taxonomiesApi.createTaxonomyTerm(workspaceId, taxonomyId, payload)
        toast.success('Term added')
        await loadTaxonomyTerms(taxonomyId)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, loadTaxonomyTerms]
  )

  return {
    objectTypes,
    layouts,
    statusSets,
    tags,
    taxonomies,
    loading,
    error,
    selectedStatusSetId,
    setSelectedStatusSetId,
    statusValues,
    statusValuesLoading,
    selectedTaxonomyId,
    setSelectedTaxonomyId,
    taxonomyTerms,
    taxonomyTermsLoading,
    createLayout,
    publishLayout,
    createStatusSet,
    createStatusValue,
    createTag,
    createTaxonomy,
    createTaxonomyTerm,
    refetch: load,
  }
}
