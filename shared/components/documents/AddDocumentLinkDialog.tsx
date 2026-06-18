'use client'

import { useEffect, useMemo, useState } from 'react'
import { Modal, Select, Typography } from '@/shared/ui'
import * as documentLinksService from '@/services/document-links.service'
import * as sessionService from '@/services/session.service'
import * as projectService from '@/services/project.service'
import * as traceabilityService from '@/services/traceability.service'
import {
  DOCUMENT_LINK_ENTITY_OPTIONS,
  DOCUMENT_RELATION_OPTIONS,
  type DocumentLinkedEntityType,
  type DocumentRelationType,
} from '@/types/document-link'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface AddDocumentLinkDialogProps {
  orgId: string
  projectId: string
  documentId: string
  open: boolean
  onClose: () => void
  onSuccess: () => void
}

type TargetOption = { value: string; label: string; sessionId?: string }

export function AddDocumentLinkDialog({
  orgId,
  projectId,
  documentId,
  open,
  onClose,
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
    void sessionService
      .listSessions(orgId, projectId, { limit: 100 })
      .then((res) => {
        setSessions(res.items.map((s) => ({ value: s.id, label: s.name })))
      })
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
          const res = await projectService.listRequirements(orgId, projectId, { limit: 200 })
          setTargets(
            res.items.map((r) => ({
              value: r.id,
              label: `${r.code} — ${r.title}`,
            }))
          )
          return
        }
        if (entityType === 'trace_item') {
          const res = await traceabilityService.listTraceLinks(orgId, projectId)
          setTargets(
            res.items.map((t) => ({
              value: t.id,
              label: `${t.link_type}: ${t.from_type} → ${t.to_type}`,
            }))
          )
          return
        }
        if (entityType === 'answer') {
          if (!sessionId) {
            setTargets([])
            return
          }
          const detail = await sessionService.getSession(orgId, projectId, sessionId)
          const questionMap = new Map(
            (detail.questions ?? []).map((q) => [q.id, q.prompt])
          )
          setTargets(
            (detail.answers ?? [])
              .filter((a) => a.answer_status === 'answered')
              .map((a) => ({
                value: a.question_id,
                label: questionMap.get(a.question_id) ?? a.question_id,
                sessionId,
              }))
          )
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
      await documentLinksService.createDocumentLink(orgId, documentId, {
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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add evidence link"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Add link', onClick: () => void handleSubmit(), variant: 'primary', loading },
      ]}
    >
      <div className="space-y-4">
        <Typography variant="small" tone="muted">
          Link this document to a session, answer, requirement, or trace item as supporting evidence.
        </Typography>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Relation
          </Typography>
          <Select
            value={relationType}
            onValueChange={(v: string) => setRelationType(v as DocumentRelationType)}
            options={DOCUMENT_RELATION_OPTIONS}
          />
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Entity type
          </Typography>
          <Select
            value={entityType}
            onValueChange={(v: string) => {
              setEntityType(v as DocumentLinkedEntityType)
              setSessionId('')
              setTargetId('')
            }}
            options={DOCUMENT_LINK_ENTITY_OPTIONS}
          />
        </div>

        {entityType === 'answer' && (
          <div>
            <Typography variant="small" weight="medium" className="mb-1 block">
              Session
            </Typography>
            <Select
              value={sessionId}
              onValueChange={setSessionId}
              options={sessionOptions}
              placeholder={loadingTargets ? 'Loading sessions…' : 'Select session'}
            />
          </div>
        )}

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Target
          </Typography>
          <Select
            value={targetId}
            onValueChange={setTargetId}
            options={targetOptions}
            placeholder={loadingTargets ? 'Loading…' : 'Select target'}
          />
        </div>
      </div>
    </Modal>
  )
}
