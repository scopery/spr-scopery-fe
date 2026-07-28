'use client'

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { ApiError } from '@/shared/lib/api-types'
import { Modal, Input, Select, Typography } from '@/shared/ui'
import * as workspaceApi from '../api/workspace.api'
import { WorkspaceJoinPolicy, WorkspaceVisibility } from '../model'

export interface CreateWorkspaceOrgOption {
  id: string
  label: string
}

export interface CreateWorkspaceModalProps {
  open: boolean
  onClose: () => void
  organizations: CreateWorkspaceOrgOption[]
  defaultOrganizationId?: string | null
  onSuccess: (workspaceId: string) => void | Promise<void>
}

function nameToCode(name: string) {
  return name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 20)
}

function sanitizeCode(raw: string) {
  return raw
    .toUpperCase()
    .replace(/[^A-Z0-9_]/g, '')
    .slice(0, 20)
}

export function CreateWorkspaceModal({
  open,
  onClose,
  organizations,
  defaultOrganizationId,
  onSuccess,
}: CreateWorkspaceModalProps) {
  const [organizationId, setOrganizationId] = useState('')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [codeTouched, setCodeTouched] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const orgOptions = useMemo(
    () => [
      { value: '', label: 'Select organization…' },
      ...organizations.map((o) => ({ value: o.id, label: o.label })),
    ],
    [organizations]
  )

  useEffect(() => {
    if (!open) return
    setOrganizationId(defaultOrganizationId ?? organizations[0]?.id ?? '')
    setName('')
    setCode('')
    setCodeTouched(false)
    setError(null)
    setSubmitting(false)
  }, [open, defaultOrganizationId, organizations])

  const canSubmit = Boolean(organizationId.trim() && name.trim() && code.trim()) && !submitting

  const handleSubmit = async () => {
    if (!canSubmit) return
    setSubmitting(true)
    setError(null)
    try {
      const created = await workspaceApi.createWorkspace({
        organizationId: organizationId.trim(),
        name: name.trim(),
        code: code.trim(),
        defaultVisibility: WorkspaceVisibility.Private,
        joinPolicy: WorkspaceJoinPolicy.InviteOnly,
      })
      toast.success('Workspace created')
      onClose()
      await onSuccess(created.id)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail || err.message
          : err instanceof Error
            ? err.message
            : 'Failed to create workspace'
      setError(msg)
      // Generic failures also toast via interceptor; keep inline for validation/authz detail
      if (err instanceof ApiError && (err.status === 403 || err.status === 400 || err.status === 422)) {
        toast.error(msg)
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title="Create workspace"
      size="md"
      actions={[
        {
          label: 'Cancel',
          variant: 'ghost',
          onClick: onClose,
          disabled: submitting,
        },
        {
          label: submitting ? 'Creating…' : 'Create workspace',
          variant: 'primary',
          onClick: () => void handleSubmit(),
          disabled: !canSubmit,
        },
      ]}
    >
      <div className="flex flex-col gap-4">
        <Typography variant="small" tone="muted">
          Create a new workspace under an organization you already belong to. Requires org
          permission to create workspaces.
        </Typography>

        {organizations.length > 1 ? (
          <div>
            <Typography variant="small" tone="muted" className="mb-1.5">
              Organization
            </Typography>
            <Select
              value={organizationId}
              onValueChange={setOrganizationId}
              options={orgOptions}
              className="w-full"
            />
          </div>
        ) : organizations.length === 1 ? (
          <div>
            <Typography variant="small" tone="muted" className="mb-1">
              Organization
            </Typography>
            <Typography weight="medium">{organizations[0]?.label}</Typography>
          </div>
        ) : (
          <Typography tone="error" variant="small">
            No organization available. Join or create an organization first.
          </Typography>
        )}

        <Input
          label="Workspace name"
          value={name}
          onChange={(e) => {
            const next = e.target.value
            setName(next)
            if (!codeTouched) setCode(nameToCode(next))
          }}
          placeholder="e.g. Product Team"
          fullWidth
          required
        />
        <Input
          label="Workspace code"
          value={code}
          onChange={(e) => {
            setCodeTouched(true)
            setCode(sanitizeCode(e.target.value))
          }}
          placeholder="e.g. PRODUCT_TEAM"
          fullWidth
          required
        />

        {error ? (
          <Typography tone="error" variant="small">
            {error}
          </Typography>
        ) : null}
      </div>
    </Modal>
  )
}
