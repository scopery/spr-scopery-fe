'use client'

import { useEffect, useMemo, useState } from 'react'
import { Input, Modal, Select, Stack, Typography } from '@/shared/ui'
import { useProjects } from '@/modules/projects/project/hooks/useProjects'
import * as supportApi from '../../infrastructure/api/support.api'
import type { CreateSupportCasePayload } from '../../domain/model/support'

const FALLBACK_REQUEST_TYPES = [
  { value: 'QUESTION', label: 'Question' },
  { value: 'BUG', label: 'Bug' },
  { value: 'INCIDENT', label: 'Incident' },
  { value: 'REQUEST', label: 'Request' },
]

const PRIORITY_OPTIONS = [
  { value: 'LOW', label: 'Low' },
  { value: 'NORMAL', label: 'Normal' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' },
]

interface CreateSupportCaseModalProps {
  workspaceId: string
  open: boolean
  onClose: () => void
  onSubmit: (body: CreateSupportCasePayload) => Promise<unknown>
  submitting?: boolean
}

export function CreateSupportCaseModal({
  workspaceId,
  open,
  onClose,
  onSubmit,
  submitting = false,
}: CreateSupportCaseModalProps) {
  const { projects, loading: projectsLoading } = useProjects(workspaceId)
  const [title, setTitle] = useState('')
  const [requestTypeCode, setRequestTypeCode] = useState('QUESTION')
  const [priority, setPriority] = useState('NORMAL')
  const [projectId, setProjectId] = useState('')
  const [portalVisible, setPortalVisible] = useState(false)
  const [typeOptions, setTypeOptions] = useState(FALLBACK_REQUEST_TYPES)
  const [fieldError, setFieldError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setTitle('')
    setRequestTypeCode('QUESTION')
    setPriority('NORMAL')
    setProjectId('')
    setPortalVisible(false)
    setFieldError(null)

    void supportApi
      .listRequestTypes(workspaceId)
      .then((res) => {
        const opts = res.items
          .filter((t) => t.enabled !== false)
          .map((t) => {
            const code = t.typeCode || t.code
            if (!code) return null
            return { value: code, label: t.name ? `${t.name} (${code})` : code }
          })
          .filter(Boolean) as Array<{ value: string; label: string }>
        if (opts.length > 0) {
          setTypeOptions(opts)
          setRequestTypeCode(opts[0]!.value)
        } else {
          setTypeOptions(FALLBACK_REQUEST_TYPES)
        }
      })
      .catch(() => {
        setTypeOptions(FALLBACK_REQUEST_TYPES)
      })
  }, [open, workspaceId])

  const projectOptions = useMemo(
    () => [
      { value: '', label: 'No project (workspace-only)' },
      ...projects.map((p) => ({
        value: p.id,
        label: p.code ? `${p.name} (${p.code})` : p.name,
      })),
    ],
    [projects]
  )

  const handleSubmit = async () => {
    if (!title.trim()) {
      setFieldError('Title is required')
      return
    }
    setFieldError(null)
    try {
      await onSubmit({
        title: title.trim(),
        requestTypeCode,
        priority,
        projectId: projectId || null,
        source: 'INTERNAL_CREATE',
        portalVisible,
      })
      onClose()
    } catch {
      // Global toast / interceptor handles API errors; keep modal open.
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New support case"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: submitting ? 'Creating…' : 'Create case',
          onClick: () => void handleSubmit(),
          variant: 'primary',
          disabled: submitting || !title.trim(),
        },
      ]}
    >
      <Stack direction="vertical" spacing="md">
        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Title
          </Typography>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief description of the issue"
            autoFocus
          />
          {fieldError ? (
            <Typography variant="small" tone="error" className="mt-1">
              {fieldError}
            </Typography>
          ) : null}
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Request type
          </Typography>
          <Select
            options={typeOptions}
            value={requestTypeCode}
            onValueChange={setRequestTypeCode}
          />
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Priority
          </Typography>
          <Select options={PRIORITY_OPTIONS} value={priority} onValueChange={setPriority} />
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1">
            Related project
          </Typography>
          <Select
            options={projectOptions}
            value={projectId}
            onValueChange={setProjectId}
            disabled={projectsLoading}
            placeholder={projectsLoading ? 'Loading projects…' : 'Optional'}
          />
          <Typography variant="small" tone="muted" className="mt-1">
            Cases can stay workspace-only, or link to a project for context.
          </Typography>
        </div>

        <label className="flex items-center gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            checked={portalVisible}
            onChange={(e) => setPortalVisible(e.target.checked)}
          />
          Visible on Client Portal
        </label>
      </Stack>
    </Modal>
  )
}
