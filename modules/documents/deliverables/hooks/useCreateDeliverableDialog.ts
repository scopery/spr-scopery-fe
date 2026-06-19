'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  getAvailableDeliverableTypes,
  getEffectiveSourceForDeliverable,
  type DeliverableEntryContext,
  type DeliverablePreviewResult,
  type DeliverableSourceEntityType,
  type DeliverableTemplateListItem,
  type DeliverableType,
} from '../model/document-deliverable-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import {
  getGovernanceBlockedReasons,
  getGovernanceWarningMessages,
  isGovernancePreviewDenied,
} from '@/utils/governanceError'
import { toast } from 'sonner'
import * as deliverablesApi from '../api/deliverables.api'
import {
  toDeliverableTypeOptions,
  toRequirementSelectOptions,
  toSessionSelectOptions,
} from '../api/create-deliverable-dialog.mapper'
import type { BuildDeliverablePayloadInput } from '../model/create-deliverable-dialog'

interface UseCreateDeliverableDialogParams {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: (documentId: string) => void
  entryContext: DeliverableEntryContext
  initialDeliverableType?: DeliverableType
  initialSourceEntityType?: DeliverableSourceEntityType
  initialSourceEntityId?: string
  initialSelectedDocumentIds: string[]
  initialSelectedDocumentTitles: string[]
  lockDeliverableType?: DeliverableType
}

export function useCreateDeliverableDialog({
  orgId,
  projectId,
  open,
  onClose,
  onSuccess,
  entryContext,
  initialDeliverableType,
  initialSourceEntityType,
  initialSourceEntityId,
  initialSelectedDocumentIds,
  initialSelectedDocumentTitles,
  lockDeliverableType,
}: UseCreateDeliverableDialogParams) {
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<string[]>(
    initialSelectedDocumentIds
  )
  const [selectedDocumentTitles, setSelectedDocumentTitles] = useState<string[]>(
    initialSelectedDocumentTitles
  )

  const hasDocumentSet = selectedDocumentIds.length > 0
  const defaultSource: DeliverableSourceEntityType =
    initialSourceEntityType ??
    (hasDocumentSet
      ? 'document_set'
      : lockDeliverableType
        ? getEffectiveSourceForDeliverable(lockDeliverableType, false)
        : 'project')

  const defaultType =
    lockDeliverableType ??
    initialDeliverableType ??
    (hasDocumentSet ? 'evidence_index_document' : 'project_brief')

  const [deliverableType, setDeliverableType] = useState<DeliverableType>(defaultType)
  const [templates, setTemplates] = useState<DeliverableTemplateListItem[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<DeliverableTemplateListItem | null>(null)
  const [title, setTitle] = useState('')
  const [sourceEntityId, setSourceEntityId] = useState(initialSourceEntityId ?? '')
  const [includeAnswerContent, setIncludeAnswerContent] = useState(false)
  const [includeArchivedDocuments, setIncludeArchivedDocuments] = useState(false)
  const [includeEvidenceIndex, setIncludeEvidenceIndex] = useState(true)
  const [sessions, setSessions] = useState<Array<{ id: string; name: string }>>([])
  const [requirements, setRequirements] = useState<Array<{ id: string; label: string }>>([])
  const [preview, setPreview] = useState<DeliverablePreviewResult | null>(null)
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [sourcesLoading, setSourcesLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const effectiveSource = getEffectiveSourceForDeliverable(deliverableType, hasDocumentSet)
  const availableTypes = getAvailableDeliverableTypes(
    lockDeliverableType
      ? getEffectiveSourceForDeliverable(lockDeliverableType, hasDocumentSet)
      : effectiveSource,
    lockDeliverableType
  )

  const deliverableTypeOptions = toDeliverableTypeOptions(availableTypes)
  const sessionOptions = toSessionSelectOptions(sessions)
  const requirementOptions = toRequirementSelectOptions(requirements)

  const showDocumentSetPicker =
    deliverableType === 'evidence_index_document' ||
    deliverableType === 'decision_log' ||
    hasDocumentSet

  const resetState = useCallback(() => {
    setSelectedDocumentIds(initialSelectedDocumentIds)
    setSelectedDocumentTitles(initialSelectedDocumentTitles)
    setDeliverableType(defaultType)
    setTemplates([])
    setSelectedTemplate(null)
    setTitle('')
    setSourceEntityId(initialSourceEntityId ?? '')
    setIncludeAnswerContent(false)
    setIncludeArchivedDocuments(false)
    setIncludeEvidenceIndex(true)
    setPreview(null)
  }, [
    defaultType,
    initialSourceEntityId,
    initialSelectedDocumentIds,
    initialSelectedDocumentTitles,
  ])

  useEffect(() => {
    if (open) {
      setSelectedDocumentIds(initialSelectedDocumentIds)
      setSelectedDocumentTitles(initialSelectedDocumentTitles)
    }
  }, [open, initialSelectedDocumentIds, initialSelectedDocumentTitles])

  useEffect(() => {
    if (!open) resetState()
  }, [open, resetState])

  useEffect(() => {
    if (!open) return
    setTemplatesLoading(true)
    void deliverablesApi
      .listDeliverableTemplates(orgId, projectId, effectiveSource)
      .then((items) => setTemplates(items))
      .catch(() => toast.error('Failed to load deliverable templates'))
      .finally(() => setTemplatesLoading(false))
  }, [open, orgId, projectId, effectiveSource])

  useEffect(() => {
    if (!availableTypes.includes(deliverableType)) {
      setDeliverableType(availableTypes[0] ?? 'project_brief')
    }
  }, [availableTypes, deliverableType])

  useEffect(() => {
    const match = templates.find((t) => t.deliverable_type === deliverableType) ?? null
    setSelectedTemplate(match)
    if (match && !title.trim()) setTitle(match.title)
    setPreview(null)
  }, [deliverableType, templates, title])

  useEffect(() => {
    if (!open || effectiveSource !== 'session') return
    setSourcesLoading(true)
    void deliverablesApi
      .listProjectSessions(orgId, projectId)
      .then((items) => setSessions(items))
      .catch(() => toast.error('Failed to load sessions'))
      .finally(() => setSourcesLoading(false))
  }, [open, orgId, projectId, effectiveSource])

  useEffect(() => {
    if (!open || effectiveSource !== 'requirement') return
    setSourcesLoading(true)
    void deliverablesApi
      .listProjectRequirements(orgId, projectId)
      .then((items) => setRequirements(items))
      .catch(() => toast.error('Failed to load requirements'))
      .finally(() => setSourcesLoading(false))
  }, [open, orgId, projectId, effectiveSource])

  const buildPayloadInput = useMemo(
    (): BuildDeliverablePayloadInput => ({
      deliverableType,
      selectedTemplate,
      effectiveSource,
      projectId,
      sourceEntityId,
      initialSourceEntityId,
      title,
      includeAnswerContent,
      includeArchivedDocuments,
      includeEvidenceIndex,
      selectedDocumentIds,
      entryContext,
    }),
    [
      deliverableType,
      selectedTemplate,
      effectiveSource,
      projectId,
      sourceEntityId,
      initialSourceEntityId,
      title,
      includeAnswerContent,
      includeArchivedDocuments,
      includeEvidenceIndex,
      selectedDocumentIds,
      entryContext,
    ]
  )

  const handlePreview = useCallback(async () => {
    if (!selectedTemplate) {
      toast.error('No template available for this deliverable type')
      return
    }
    if (effectiveSource === 'session' && !sourceEntityId && !initialSourceEntityId) {
      toast.error('Select a session')
      return
    }
    if (effectiveSource === 'requirement' && !sourceEntityId && !initialSourceEntityId) {
      toast.error('Select a requirement')
      return
    }
    if (
      (effectiveSource === 'document_set' || deliverableType === 'evidence_index_document') &&
      selectedDocumentIds.length === 0
    ) {
      toast.error('Select at least one document for this deliverable')
      return
    }

    if (preview?.readiness?.readiness_status === 'blocked') {
      toast.error(preview.readiness.blocking_issues[0]?.message ?? 'Deliverable is blocked')
      return
    }

    setPreviewLoading(true)
    try {
      const result = await deliverablesApi.previewDeliverable(orgId, projectId, buildPayloadInput)
      setPreview(result)
      if (!title.trim()) setTitle(result.title)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
      setPreview(null)
    } finally {
      setPreviewLoading(false)
    }
  }, [
    selectedTemplate,
    effectiveSource,
    sourceEntityId,
    initialSourceEntityId,
    deliverableType,
    selectedDocumentIds,
    preview,
    orgId,
    projectId,
    buildPayloadInput,
    title,
  ])

  const governanceBlockedReasons = getGovernanceBlockedReasons(preview?.governance_decision)
  const governanceDenied = isGovernancePreviewDenied(preview?.governance_decision)
  const governanceWarnings = getGovernanceWarningMessages(preview?.governance_decision)
  const canCreateFromPreview = Boolean(
    preview?.can_create && !governanceDenied && preview.readiness?.readiness_status !== 'blocked'
  )

  const handleCreate = useCallback(async () => {
    setCreating(true)
    try {
      let activePreview = preview
      if (!activePreview?.can_create) {
        if (!selectedTemplate) {
          toast.error('No template available')
          return
        }
        activePreview = await deliverablesApi.previewDeliverable(
          orgId,
          projectId,
          buildPayloadInput
        )
        setPreview(activePreview)
        if (!title.trim()) setTitle(activePreview.title)
      }
      if (
        !activePreview.can_create ||
        activePreview.readiness?.readiness_status === 'blocked' ||
        isGovernancePreviewDenied(activePreview.governance_decision)
      ) {
        const governanceReason = getGovernanceBlockedReasons(activePreview.governance_decision)[0]
        toast.error(
          governanceReason ??
            activePreview.readiness?.blocking_issues[0]?.message ??
            activePreview.blocking_errors[0] ??
            'Cannot create deliverable'
        )
        return
      }

      const result = await deliverablesApi.createDeliverable(orgId, projectId, buildPayloadInput)
      const readinessLabel = result.readiness?.readiness_status ?? 'draft'
      toast.success('Deliverable created as draft', {
        description: `${result.title} · ${readinessLabel.replace('_', ' ')}`,
        action: {
          label: 'Open',
          onClick: () => onSuccess(result.document_id),
        },
      })
      onSuccess(result.document_id)
      onClose()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setCreating(false)
    }
  }, [preview, selectedTemplate, orgId, projectId, buildPayloadInput, title, onSuccess, onClose])

  const handleDocumentSelectionChange = useCallback((ids: string[], titles: string[]) => {
    setSelectedDocumentIds(ids)
    setSelectedDocumentTitles(titles)
    setPreview(null)
  }, [])

  return {
    hasDocumentSet,
    showDocumentSetPicker,
    effectiveSource,
    deliverableType,
    deliverableTypeOptions,
    selectedTemplate,
    title,
    sourceEntityId,
    includeAnswerContent,
    includeArchivedDocuments,
    includeEvidenceIndex,
    sessionOptions,
    requirementOptions,
    preview,
    templatesLoading,
    sourcesLoading,
    previewLoading,
    creating,
    selectedDocumentIds,
    selectedDocumentTitles,
    governanceBlockedReasons,
    governanceDenied,
    canCreateFromPreview,
    governanceWarnings,
    setDeliverableType,
    setTitle,
    setSourceEntityId,
    setIncludeAnswerContent,
    setIncludeArchivedDocuments,
    setIncludeEvidenceIndex,
    handleDocumentSelectionChange,
    handlePreview,
    handleCreate,
  }
}
