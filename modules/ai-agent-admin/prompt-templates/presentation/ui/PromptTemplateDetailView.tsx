'use client'

import { useMemo, useState } from 'react'
import NextLink from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin'
import { useAgents } from '@/modules/ai-agent-admin/agents'
import {
  Button,
  ConfirmDialog,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Stack,
  Typography,
  DataTable,
} from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import {
  PROMPT_CONTENT_FORMAT_OPTIONS,
  PromptContentFormat,
  PromptVersionStatus,
} from '../../domain/enums/prompt.enum'
import { validatePromptContent, validateVariableSchema } from '../../domain/rules/prompt.rules'
import { usePromptTemplateDetail, usePromptVersions } from '../hooks/usePrompts'
import * as promptsApi from '../../infrastructure/api/prompts.api'
import { usePromptTemplateMutations, usePromptVersionMutations } from '../hooks/usePromptMutations'
import { PromptTemplateFormModal } from './PromptTemplateFormModal'

export function PromptTemplateDetailView() {
  const { templateId } = useParams<{ templateId: string }>()
  const router = useRouter()
  const canManage = useCanManageAiConfig()
  const { template, loading, error, refetch } = usePromptTemplateDetail(templateId)
  const { items: agents } = useAgents({ page: 0, size: 100 })
  const {
    items: versions,
    loading: versionsLoading,
    refetch: refetchVersions,
  } = usePromptVersions({ templateId, page: 0, size: 50 })
  const { activate, deactivate } = usePromptTemplateMutations(refetch)
  const { saving, create: createVersion } = usePromptVersionMutations(() => {
    void refetchVersions()
  })

  const [editOpen, setEditOpen] = useState(false)
  const [createVersionOpen, setCreateVersionOpen] = useState(false)
  const [deactivateOpen, setDeactivateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentFormat, setContentFormat] = useState<PromptContentFormat>(PromptContentFormat.Text)
  const [variableSchema, setVariableSchema] = useState('')
  const [changeNote, setChangeNote] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)

  const draftCount = useMemo(
    () => versions.filter((v) => v.status === PromptVersionStatus.Draft).length,
    [versions]
  )
  const activeVersion = useMemo(
    () => versions.find((v) => v.status === PromptVersionStatus.Active),
    [versions]
  )
  const agent = agents.find((item) => item.id === template?.agentId)

  const resetCreateForm = () => {
    setTitle('')
    setContent('')
    setContentFormat(PromptContentFormat.Text)
    setVariableSchema('')
    setChangeNote('')
    setFieldError(null)
  }

  const handleCreateVersion = async () => {
    setFieldError(null)
    if (!title.trim()) {
      setFieldError('Title is required')
      return
    }
    const contentError = validatePromptContent(contentFormat, content)
    if (contentError) {
      setFieldError(contentError)
      return
    }
    const schemaError = validateVariableSchema(variableSchema)
    if (schemaError) {
      setFieldError(schemaError)
      return
    }
    try {
      const created = await createVersion({
        templateId,
        title: title.trim(),
        content,
        contentFormat,
        variableSchema: variableSchema.trim() || null,
        changeNote: changeNote.trim() || null,
      })
      setCreateVersionOpen(false)
      resetCreateForm()
      router.push(ADMIN_ROUTES.aiControlPromptVersion(templateId, created.id))
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setFieldError(err.problem.detail || 'Validation failed')
      }
    }
  }

  if ((loading || versionsLoading) && !template) {
    return <PageSkeleton variant="detail" className="p-lg" />
  }
  if (error || !template) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Template not found'}</Typography>
        <Button as={NextLink} href={ADMIN_ROUTES.aiControlPrompts} size="sm" variant="outline">
          Back to templates
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button as={NextLink} href={ADMIN_ROUTES.aiControlPrompts} size="sm" variant="ghost">
            ← Templates
          </Button>
          <Typography variant="h2" className="mt-sm">
            {template.name}
          </Typography>
          <Typography variant="caption" tone="muted" className="mt-1 block font-normal">
            {template.code}
          </Typography>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage ? (
            <>
              <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
                Edit metadata
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  resetCreateForm()
                  setCreateVersionOpen(true)
                }}
              >
                Create version
              </Button>
              {template.status !== 'ACTIVE' ? (
                <Button size="sm" variant="outline" onClick={() => void activate(template.id)}>
                  Activate template
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => setDeactivateOpen(true)}>
                  Deactivate
                </Button>
              )}
            </>
          ) : null}
        </div>
      </div>

      <div className="flex flex-wrap gap-md">
        <AiLifecycleStatusBadge status={template.status} />
        <Typography variant="caption" tone="muted">
          Active version: {activeVersion?.title ?? '—'} · Drafts: {draftCount}
        </Typography>
      </div>

      {template.description ? (
        <Typography variant="small">{template.description}</Typography>
      ) : null}

      <div>
        <Typography variant="h3" className="mb-md">
          Version history
        </Typography>
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <DataTable
            ariaLabel="Prompt Template Detail"
            rows={versions}
            rowKey={(v) => String(v.id)}
            emptyMessage="No items."
            columns={[
              { id: 'title', header: 'Title', accessor: 'title' },
              { id: 'format', header: 'Format', accessor: 'contentFormat' },
              {
                id: 'status',
                header: 'Status',
                cell: (v) => (
                  <>
                    <AiLifecycleStatusBadge status={v.status} />
                  </>
                ),
              },
              {
                id: 'updated',
                header: 'Updated',
                cell: (v) => <>{v.updatedAt ? new Date(v.updatedAt).toLocaleString() : '—'}</>,
                cellClassName: 'text-xs text-neutral-500',
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (v) => (
                  <div className="flex items-center gap-sm">
                    <Button
                      as={NextLink}
                      href={ADMIN_ROUTES.aiControlPromptVersion(templateId, v.id)}
                      size="sm"
                      variant="ghost"
                    >
                      Open studio
                    </Button>
                    {canManage ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={saving}
                        onClick={() =>
                          void promptsApi.getPromptVersion(v.id).then((detail) =>
                            createVersion({
                              templateId,
                              title: `${detail.title} (copy)`,
                              content: detail.content,
                              contentFormat: detail.contentFormat,
                              variableSchema: detail.variableSchema ?? null,
                              changeNote: `Duplicated from version ${detail.versionNumber ?? detail.id}`,
                            }).then((copy) => {
                              router.push(ADMIN_ROUTES.aiControlPromptVersion(templateId, copy.id))
                            })
                          )
                        }
                      >
                        Duplicate
                      </Button>
                    ) : null}
                  </div>
                ),
              },
            ]}
          />
        </div>
      </div>

      <PromptTemplateFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        template={template}
        agentOptions={[
          {
            value: template.agentId,
            label: agent ? `${agent.name} (${agent.code})` : 'Unavailable agent',
          },
        ]}
        onSaved={() => void refetch()}
      />

      <Modal
        open={createVersionOpen}
        onClose={() => {
          setCreateVersionOpen(false)
          resetCreateForm()
        }}
        title="Create draft version"
        size="lg"
        actions={[
          {
            label: 'Cancel',
            onClick: () => {
              setCreateVersionOpen(false)
              resetCreateForm()
            },
            variant: 'ghost',
          },
          {
            label: 'Create draft',
            onClick: () => void handleCreateVersion(),
            variant: 'primary',
            disabled: saving,
          },
        ]}
      >
        <Stack direction="vertical" spacing="md">
          {fieldError ? (
            <Typography tone="error" variant="small">
              {fieldError}
            </Typography>
          ) : null}
          <Input label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Content format
            </Typography>
            <Select
              value={contentFormat}
              onValueChange={(v: string) => setContentFormat(v as PromptContentFormat)}
              options={PROMPT_CONTENT_FORMAT_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </div>
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Content
            </Typography>
            <textarea
              className="min-h-[160px] w-full border border-neutral-200 p-sm text-sm font-normal"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Variable schema (JSON)
            </Typography>
            <textarea
              className="min-h-[80px] w-full border border-neutral-200 p-sm text-sm font-normal"
              value={variableSchema}
              onChange={(e) => setVariableSchema(e.target.value)}
              placeholder='{"vars":[]}'
            />
          </div>
          <Input
            label="Change note"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
          />
        </Stack>
      </Modal>

      <ConfirmDialog
        open={deactivateOpen}
        onClose={() => setDeactivateOpen(false)}
        title="Deactivate template"
        message={`Deactivate “${template.name}”?`}
        confirmLabel="Deactivate"
        variant="danger"
        onConfirm={() => void deactivate(template.id).then(() => setDeactivateOpen(false))}
      />
    </Stack>
  )
}
