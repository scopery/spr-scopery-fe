'use client'

import { useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import type { DocumentLinkedEntityType, DocumentRelationType } from '../model/document-link-types'
import { toast } from 'sonner'
import * as documentLinksApi from '../api/document-links.api'
import type { AddDocumentLinkDialogProps, TargetOption } from '../model/document-links'

export function useAddDocumentLinkDialog({
  orgId,
  projectId,
  documentId,
  open,
  onSuccess,
}: AddDocumentLinkDialogProps) {
  const [entityType, setEntityType] = useState<DocumentLinkedEntityType>('session')
  const [relationType, setRelationType] = useState<DocumentRelationType>('evidence_for')
  const [sessionId, setSessionId] = useState('')
  const [targetId, setTargetId] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingTargets, setLoadingTargets] = useState(false)
  const [sessions, setSessions] = useState<TargetOption[]>([])
  const [targets, setTargets] = useState<TargetOption[]>([])

  useEffect(() => {
    if (!open) {
      setEntityType('session')
      setRelationType('evidence_for')
      setSessionId('')
      setTargetId('')
      setSessions([])
      setTargets([])
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    setLoadingTargets(true)
    void documentLinksApi
      .listSessionTargets(orgId, projectId)
      .then(setSessions)
      .catch(() => setSessions([]))
      .finally(() => setLoadingTargets(false))
  }, [open, orgId, projectId])

  useEffect(() => {
    if (!open) return

    setTargetId('')
    setLoadingTargets(true)

    const load = async () => {
      try {
        if (entityType === 'session') {
          setTargets(sessions)
          return
        }
        if (entityType === 'requirement') {
          setTargets(await documentLinksApi.listRequirementTargets(orgId, projectId))
          return
        }
        if (entityType === 'trace_item') {
          setTargets(await documentLinksApi.listTraceItemTargets(orgId, projectId))
          return
        }
        if (entityType === 'answer') {
          if (!sessionId) {
            setTargets([])
            return
          }
          setTargets(await documentLinksApi.listAnswerTargets(orgId, projectId, sessionId))
        }
      } catch {
        setTargets([])
        toast.error('Failed to load link targets')
      } finally {
        setLoadingTargets(false)
      }
    }

    void load()
  }, [open, entityType, sessionId, orgId, projectId, sessions])

  const sessionOptions = useMemo(
    () => sessions.map((s) => ({ value: s.value, label: s.label })),
    [sessions]
  )

  const targetOptions = useMemo(
    () => targets.map((t) => ({ value: t.value, label: t.label })),
    [targets]
  )

  const handleEntityTypeChange = (value: DocumentLinkedEntityType) => {
    setEntityType(value)
    setSessionId('')
    setTargetId('')
  }

  const handleSubmit = async () => {
    if (!targetId) {
      toast.error('Select a target entity')
      return
    }
    if (entityType === 'answer' && !sessionId) {
      toast.error('Select a session for the answer')
      return
    }

    setLoading(true)
    try {
      await documentLinksApi.createDocumentLink(orgId, documentId, {
        linked_entity_type: entityType,
        linked_entity_id: targetId,
        relation_type: relationType,
        project_id: projectId,
        session_id: entityType === 'answer' ? sessionId : undefined,
      })
      toast.success('Evidence link created')
      onSuccess()
    } catch (err) {
      const msg = err instanceof ApiError ? err.problem.detail : 'Failed to create link'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return {
    entityType,
    relationType,
    sessionId,
    targetId,
    loading,
    loadingTargets,
    sessionOptions,
    targetOptions,
    setRelationType,
    setSessionId,
    setTargetId,
    handleEntityTypeChange,
    handleSubmit,
  }
}
