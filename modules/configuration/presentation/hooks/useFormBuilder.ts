'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import * as objectTypesApi from '../../infrastructure/api/object-types.api'
import * as customFieldsApi from '../../infrastructure/api/custom-fields.api'
import * as formsApi from '../../infrastructure/api/forms.api'
import * as formSectionsApi from '../../infrastructure/api/form-sections.api'
import * as formFieldsApi from '../../infrastructure/api/form-fields.api'
import type { ObjectType } from '../../domain/model/object-type'
import type { CustomFieldDefinition } from '../../domain/model/custom-field'
import type { CustomFormDefinition } from '../../domain/model/form'
import type { CustomFormVersion } from '../../domain/model/form-version'
import type { CreateFormSectionPayload, CustomFormSection } from '../../domain/model/form-section'
import type { CreateFormFieldPayload, CustomFormField } from '../../domain/model/form-field'
import { groupFormFieldsBySection } from '../../domain/rules/configuration.rules'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'

export function useFormBuilder(workspaceId: string | null, formId: string | null) {
  const [objectTypes, setObjectTypes] = useState<ObjectType[]>([])
  const [customFields, setCustomFields] = useState<CustomFieldDefinition[]>([])
  const [form, setForm] = useState<CustomFormDefinition | null>(null)
  const [versions, setVersions] = useState<CustomFormVersion[]>([])
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [sections, setSections] = useState<CustomFormSection[]>([])
  const [fields, setFields] = useState<CustomFormField[]>([])
  const [loading, setLoading] = useState(true)
  const [structureLoading, setStructureLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [creatingVersion, setCreatingVersion] = useState(false)
  const [publishing, setPublishing] = useState(false)

  const load = useCallback(async () => {
    if (!workspaceId || !formId) return
    setLoading(true)
    setError(null)
    try {
      const [types, fieldDefs, formDetail, versionList] = await Promise.all([
        objectTypesApi.listObjectTypes(),
        customFieldsApi.listCustomFields(workspaceId),
        formsApi.getForm(workspaceId, formId),
        formsApi.listFormVersions(workspaceId, formId),
      ])
      setObjectTypes(types)
      setCustomFields(fieldDefs)
      setForm(formDetail)
      setVersions(versionList)
      setSelectedVersionId((prev) => {
        if (prev && versionList.some((v) => v.id === prev)) return prev
        const current = versionList.find((v) => v.id === formDetail.currentVersionId)
        const latest = [...versionList].sort((a, b) => b.versionNumber - a.versionNumber)[0]
        return current?.id ?? latest?.id ?? null
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load form'
      setError(msg)
      toast.error(getProblemToastMessage(err))
    } finally {
      setLoading(false)
    }
  }, [workspaceId, formId])

  useEffect(() => {
    void load()
  }, [load])

  const loadStructure = useCallback(
    async (versionId: string) => {
      if (!workspaceId || !formId) return
      setStructureLoading(true)
      try {
        const [sectionList, fieldList] = await Promise.all([
          formSectionsApi.listFormSections(workspaceId, formId, versionId),
          formFieldsApi.listFormFields(workspaceId, formId, versionId),
        ])
        setSections(sectionList)
        setFields(fieldList)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
      } finally {
        setStructureLoading(false)
      }
    },
    [workspaceId, formId]
  )

  useEffect(() => {
    if (selectedVersionId) {
      void loadStructure(selectedVersionId)
    } else {
      setSections([])
      setFields([])
    }
  }, [selectedVersionId, loadStructure])

  const createVersion = useCallback(async () => {
    if (!workspaceId || !formId) return
    setCreatingVersion(true)
    try {
      const created = await formsApi.createFormVersion(workspaceId, formId)
      toast.success('Version created')
      await load()
      setSelectedVersionId(created.id)
      return created
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      throw err
    } finally {
      setCreatingVersion(false)
    }
  }, [workspaceId, formId, load])

  const publishVersion = useCallback(
    async (versionId: string) => {
      if (!workspaceId || !formId) return
      setPublishing(true)
      try {
        await formsApi.publishFormVersion(workspaceId, formId, versionId)
        toast.success('Version published')
        await load()
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      } finally {
        setPublishing(false)
      }
    },
    [workspaceId, formId, load]
  )

  const createSection = useCallback(
    async (payload: CreateFormSectionPayload) => {
      if (!workspaceId || !formId || !selectedVersionId) return
      try {
        await formSectionsApi.createFormSection(workspaceId, formId, selectedVersionId, payload)
        toast.success('Section added')
        await loadStructure(selectedVersionId)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, formId, selectedVersionId, loadStructure]
  )

  const createField = useCallback(
    async (payload: CreateFormFieldPayload) => {
      if (!workspaceId || !formId || !selectedVersionId) return
      try {
        await formFieldsApi.createFormField(workspaceId, formId, selectedVersionId, payload)
        toast.success('Field added')
        await loadStructure(selectedVersionId)
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        throw err
      }
    },
    [workspaceId, formId, selectedVersionId, loadStructure]
  )

  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? null
  const fieldGroups = useMemo(() => groupFormFieldsBySection(fields, sections), [fields, sections])

  return {
    objectTypes,
    customFields,
    form,
    versions,
    selectedVersion,
    selectedVersionId,
    setSelectedVersionId,
    sections,
    fields,
    fieldGroups,
    loading,
    structureLoading,
    error,
    creatingVersion,
    publishing,
    createVersion,
    publishVersion,
    createSection,
    createField,
    refetch: load,
  }
}
