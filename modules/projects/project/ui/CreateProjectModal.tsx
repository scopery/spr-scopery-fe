'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import { Modal, Input, Select, Typography } from '@/shared/ui'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { UserSearchSelect, useResolveUsers, type PersonIdentity } from '@/modules/platform'
import { useWorkspaceMembers } from '@/modules/org/workspace'
import * as projectsApi from '../api/projects.api'
import { projectCodeFromName } from '../model/project'
import type { CreateProjectModalProps } from '../model/project'

interface TemplateOption {
  value: string
  templateId: string
  versionId: string
  name: string
  versionLabel: string
}

const STEP_TITLES = [
  'Create project — identity',
  'Create project — owner',
  'Create project — schedule',
  'Create project — template',
] as const

function isActiveMember(status: string): boolean {
  return status.toUpperCase() === 'ACTIVE'
}

function parseTemplateValue(value: string): { templateId: string; versionId: string } | null {
  const [templateId, versionId] = value.split(':')
  if (!templateId || !versionId) return null
  return { templateId, versionId }
}

export function CreateProjectModal({
  workspaceId,
  open,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const { session, profile } = useAuth()
  const currentUserId = session?.user?.id ?? profile?.user_id ?? ''

  const {
    members,
    loading: membersLoading,
    error: membersError,
  } = useWorkspaceMembers(open ? workspaceId : null)
  const memberUserIds = useMemo(() => members.map((m) => m.userId), [members])
  const { personFor } = useResolveUsers(memberUserIds)
  const ownerPeople = useMemo(
    () =>
      members
        .filter((member) => isActiveMember(member.status))
        .map((member) => personFor(member.userId))
        .filter((person): person is PersonIdentity => Boolean(person)),
    [members, personFor]
  )

  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [ownerUserId, setOwnerUserId] = useState('')
  const [defaultCurrency, setDefaultCurrency] = useState('VND')
  const [plannedStartDate, setPlannedStartDate] = useState('')
  const [plannedEndDate, setPlannedEndDate] = useState('')
  const [templateValue, setTemplateValue] = useState('')
  const [templates, setTemplates] = useState<TemplateOption[]>([])
  const [templatesLoading, setTemplatesLoading] = useState(false)
  const [templatesError, setTemplatesError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep(0)
    setName('')
    setCode('')
    setDescription('')
    setOwnerUserId(currentUserId)
    setDefaultCurrency('VND')
    setPlannedStartDate('')
    setPlannedEndDate('')
    setTemplateValue('')
    setTemplatesError(null)
  }, [open, currentUserId])

  useEffect(() => {
    if (!open || step !== 3) return
    let cancelled = false
    setTemplatesLoading(true)
    setTemplatesError(null)
    void projectsApi
      .listPublishedTemplates(workspaceId, 50)
      .then((items) => {
        if (cancelled) return
        setTemplates(
          items.map((t) => ({
            value: t.value,
            templateId: t.templateId,
            versionId: t.versionId,
            name: t.name,
            versionLabel: t.versionLabel,
          }))
        )
      })
      .catch((err) => {
        if (cancelled) return
        setTemplates([])
        setTemplatesError(err instanceof Error ? err.message : 'Could not load project templates')
      })
      .finally(() => {
        if (!cancelled) setTemplatesLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [open, step, workspaceId])

  const handleNameChange = useCallback(
    (value: string) => {
      setName(value)
      setCode((prev) => {
        if (!prev || prev === projectCodeFromName(name)) {
          return projectCodeFromName(value)
        }
        return prev
      })
    },
    [name]
  )

  const canNextFromIdentity =
    name.trim().length > 0 && (code.trim() || projectCodeFromName(name)).length > 0

  const handleSubmit = useCallback(async () => {
    const trimmedName = name.trim()
    const trimmedCode = (code.trim() || projectCodeFromName(trimmedName)).trim()
    if (!trimmedName || !trimmedCode) return
    setLoading(true)
    try {
      const selected = parseTemplateValue(templateValue)
      if (selected) {
        const created = await projectsApi.createProjectFromTemplate({
          workspaceId,
          templateId: selected.templateId,
          versionId: selected.versionId,
          code: trimmedCode,
          name: trimmedName,
          description: description.trim() || undefined,
          ownerUserId: ownerUserId.trim() || undefined,
          defaultCurrency: defaultCurrency.trim() || undefined,
          plannedStartDate: plannedStartDate || undefined,
          plannedEndDate: plannedEndDate || undefined,
        })
        toast.success('Project created from template')
        onSuccess(created.id)
      } else {
        const project = await projectsApi.createProject({
          workspaceId,
          code: trimmedCode,
          name: trimmedName,
          description: description.trim() || undefined,
          ownerUserId: ownerUserId.trim() || undefined,
          defaultCurrency: defaultCurrency.trim() || undefined,
          plannedStartDate: plannedStartDate || undefined,
          plannedEndDate: plannedEndDate || undefined,
        })
        toast.success('Project created')
        onSuccess(project.id)
      }
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to create project'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [
    name,
    code,
    description,
    ownerUserId,
    defaultCurrency,
    plannedStartDate,
    plannedEndDate,
    templateValue,
    workspaceId,
    onSuccess,
  ])

  const templateOptions = [
    { value: '', label: 'No template' },
    ...templates.map((t) => ({
      value: t.value,
      label: `${t.name} (${t.versionLabel})`,
    })),
  ]

  const actions =
    step === 0
      ? [
          { label: 'Cancel', onClick: onClose, variant: 'ghost' as const },
          {
            label: 'Next',
            onClick: () => setStep(1),
            variant: 'primary' as const,
            disabled: !canNextFromIdentity,
          },
        ]
      : step === 1
        ? [
            { label: 'Back', onClick: () => setStep(0), variant: 'ghost' as const },
            { label: 'Next', onClick: () => setStep(2), variant: 'primary' as const },
          ]
        : step === 2
          ? [
              { label: 'Back', onClick: () => setStep(1), variant: 'ghost' as const },
              { label: 'Next', onClick: () => setStep(3), variant: 'primary' as const },
            ]
          : [
              { label: 'Back', onClick: () => setStep(2), variant: 'ghost' as const },
              {
                label: templateValue ? 'Create from template' : 'Create',
                onClick: () => void handleSubmit(),
                variant: 'primary' as const,
                loading,
              },
            ]

  return (
    <Modal open={open} onClose={onClose} title={STEP_TITLES[step]} size="md" actions={actions}>
      {step === 0 && (
        <div className="space-y-4">
          <Input
            label="Project name"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="e.g. Acme Scoping"
            fullWidth
          />
          <Input
            label="Code"
            required
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. ACME_SCOPING"
            fullWidth
          />
          <Input
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief description"
            fullWidth
          />
        </div>
      )}
      {step === 1 && (
        <div className="space-y-4">
          <Typography variant="small" tone="muted">
            Choose a workspace member as project owner. Defaults to you.
          </Typography>
          {membersLoading ? (
            <Typography variant="small" tone="muted">
              Loading members…
            </Typography>
          ) : (
            <div>
              <UserSearchSelect
                label="Owner (optional)"
                value={ownerUserId}
                onChange={setOwnerUserId}
                seedPeople={ownerPeople}
                allowRemoteSearch={false}
              />
              {membersError ? (
                <Typography variant="small" className="mt-2 text-amber-700">
                  Could not load all members. You can still assign yourself or leave empty.
                </Typography>
              ) : null}
            </div>
          )}
        </div>
      )}
      {step === 2 && (
        <div className="space-y-4">
          <Input
            label="Currency"
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value.toUpperCase())}
            placeholder="VND"
            fullWidth
          />
          <Input
            label="Planned start"
            type="date"
            value={plannedStartDate}
            onChange={(e) => setPlannedStartDate(e.target.value)}
            fullWidth
          />
          <Input
            label="Planned end"
            type="date"
            value={plannedEndDate}
            onChange={(e) => setPlannedEndDate(e.target.value)}
            fullWidth
          />
        </div>
      )}
      {step === 3 && (
        <div className="space-y-4">
          <Typography variant="small" tone="muted">
            Optional. Choose an active project template with a published version — phases/tasks will
            be copied into the new project.
          </Typography>
          {templatesLoading ? (
            <Typography variant="small" tone="muted">
              Loading templates…
            </Typography>
          ) : templatesError ? (
            <Typography variant="small" className="text-red-700">
              {templatesError}. You can still create without a template.
            </Typography>
          ) : (
            <div>
              <Typography variant="small" className="mb-1.5">
                Template (optional)
              </Typography>
              <Select
                value={templateValue}
                onValueChange={setTemplateValue}
                options={templateOptions}
                placeholder="No template"
              />
              {templates.length === 0 ? (
                <Typography variant="small" tone="muted" className="mt-2">
                  No active templates with a published version. Publish one under Admin → Project
                  templates, then try again.
                </Typography>
              ) : null}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
