'use client'

import { useEffect, useState } from 'react'
import NextLink from 'next/link'
import { useParams } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'
import {
  Button,
  ConfirmDialog,
  Input,
  PageSkeleton,
  Select,
  Stack,
  Typography,
} from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { useCanManageAiConfig } from '../../../presentation/hooks/useCanManageAiConfig'
import { AiLifecycleStatusBadge } from '../../../presentation/ui/AiLifecycleStatusBadge'
import {
  PROMPT_CONTENT_FORMAT_OPTIONS,
  PromptContentFormat,
  PromptVersionStatus,
} from '../../domain/enums/prompt.enum'
import {
  isPromptVersionEditable,
  validatePromptContent,
  validateVariableSchema,
} from '../../domain/rules/prompt.rules'
import {
  usePromptTemplateDetail,
  usePromptVersionDetail,
  usePromptVersions,
} from '../hooks/usePrompts'
import { usePromptVersionMutations } from '../hooks/usePromptMutations'

export function PromptVersionStudioView() {
  const { templateId, versionId } = useParams<{
    templateId: string
    versionId: string
  }>()
  const canManage = useCanManageAiConfig()
  const { template } = usePromptTemplateDetail(templateId)
  const { version, loading, error, refetch } = usePromptVersionDetail(versionId)
  const { refetch: refetchVersions } = usePromptVersions({
    templateId,
    page: 0,
    size: 50,
  })
  const { saving, update, activate, archive } = usePromptVersionMutations(() => {
    void refetch()
    void refetchVersions()
  })

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [contentFormat, setContentFormat] = useState<PromptContentFormat>(PromptContentFormat.Text)
  const [variableSchema, setVariableSchema] = useState('')
  const [changeNote, setChangeNote] = useState('')
  const [fieldError, setFieldError] = useState<string | null>(null)
  const [activateOpen, setActivateOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const editable = version ? isPromptVersionEditable(version.status) : false

  useEffect(() => {
    if (!version) return
    setTitle(version.title)
    setContent(version.content)
    setContentFormat(version.contentFormat)
    setVariableSchema(version.variableSchema ?? '')
    setChangeNote(version.changeNote ?? '')
    setFieldError(null)
  }, [version])

  const handleSave = async () => {
    if (!version || !editable) return
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
      await update(version.id, {
        title: title.trim(),
        content,
        contentFormat,
        variableSchema: variableSchema.trim() || null,
        changeNote: changeNote.trim() || null,
      })
    } catch (err) {
      if (err instanceof ApiError && (err.status === 400 || err.status === 422)) {
        setFieldError(err.problem.detail || 'Validation failed')
      }
    }
  }

  if (loading && !version) return <PageSkeleton variant="detail" className="p-lg" />
  if (error || !version) {
    return (
      <Stack direction="vertical" spacing="md" className="p-lg">
        <Typography tone="error">{error ?? 'Version not found'}</Typography>
        <Button
          as={NextLink}
          href={ADMIN_ROUTES.aiControlPrompt(templateId)}
          size="sm"
          variant="outline"
        >
          Back to template
        </Button>
      </Stack>
    )
  }

  return (
    <Stack direction="vertical" spacing="lg" className="p-lg">
      <div className="flex flex-wrap items-start justify-between gap-md">
        <div>
          <Button
            as={NextLink}
            href={ADMIN_ROUTES.aiControlPrompt(templateId)}
            size="sm"
            variant="ghost"
          >
            ← {template?.name ?? 'Template'}
          </Button>
          <Typography variant="h2" className="mt-sm">
            Prompt Version Studio
          </Typography>
          <div className="mt-sm flex flex-wrap items-center gap-sm">
            <AiLifecycleStatusBadge status={version.status} />
            {!editable ? (
              <Typography variant="caption" tone="muted">
                Read-only — only DRAFT versions are editable
              </Typography>
            ) : null}
          </div>
        </div>
        <div className="flex flex-wrap gap-sm">
          {canManage && editable ? (
            <Button size="sm" disabled={saving} onClick={() => void handleSave()}>
              Save draft
            </Button>
          ) : null}
          {canManage && version.status === PromptVersionStatus.Draft ? (
            <Button size="sm" variant="outline" onClick={() => setActivateOpen(true)}>
              Activate
            </Button>
          ) : null}
          {canManage &&
          (version.status === PromptVersionStatus.Draft ||
            version.status === PromptVersionStatus.Active) ? (
            <Button size="sm" variant="outline" onClick={() => setArchiveOpen(true)}>
              Archive
            </Button>
          ) : null}
          <Button
            as={NextLink}
            href={ADMIN_ROUTES.aiControlPlayground}
            size="sm"
            variant="ghost"
          >
            Preview in playground
          </Button>
        </div>
      </div>

      {fieldError ? <Typography tone="error">{fieldError}</Typography> : null}

      <div className="grid gap-lg lg:grid-cols-2">
        <Stack direction="vertical" spacing="md">
          <Typography variant="h3">Metadata</Typography>
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={!editable || !canManage}
          />
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
              disabled={!editable || !canManage}
            />
          </div>
          <Input
            label="Change note"
            value={changeNote}
            onChange={(e) => setChangeNote(e.target.value)}
            disabled={!editable || !canManage}
          />
          <div>
            <Typography variant="caption" tone="muted" className="mb-1 block">
              Variable schema (JSON)
            </Typography>
            <textarea
              className="min-h-[120px] w-full border border-neutral-200 p-sm font-mono text-sm disabled:bg-neutral-50"
              value={variableSchema}
              onChange={(e) => setVariableSchema(e.target.value)}
              disabled={!editable || !canManage}
            />
          </div>
        </Stack>

        <Stack direction="vertical" spacing="md">
          <Typography variant="h3">Prompt editor</Typography>
          <textarea
            className="min-h-[360px] w-full border border-neutral-200 p-sm font-mono text-sm disabled:bg-neutral-50"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={!editable || !canManage}
          />
        </Stack>
      </div>

      {(version.systemPrompt || version.userPromptTemplate) ? (
        <Stack direction="vertical" spacing="md">
          <div>
            <Typography variant="h3">Rendered prompts</Typography>
            <Typography variant="caption" tone="muted">
              Read-only — computed from the content template above
            </Typography>
          </div>
          <div className="grid gap-lg lg:grid-cols-2">
            {version.systemPrompt ? (
              <Stack direction="vertical" spacing="sm">
                <Typography variant="caption" tone="muted" className="block font-medium uppercase tracking-wide">
                  System prompt
                </Typography>
                <textarea
                  className="min-h-[240px] w-full border border-neutral-200 bg-neutral-50 p-sm font-mono text-sm"
                  value={version.systemPrompt}
                  readOnly
                />
              </Stack>
            ) : null}
            {version.userPromptTemplate ? (
              <Stack direction="vertical" spacing="sm">
                <Typography variant="caption" tone="muted" className="block font-medium uppercase tracking-wide">
                  User prompt template
                </Typography>
                <textarea
                  className="min-h-[240px] w-full border border-neutral-200 bg-neutral-50 p-sm font-mono text-sm"
                  value={version.userPromptTemplate}
                  readOnly
                />
              </Stack>
            ) : null}
          </div>
        </Stack>
      ) : null}

      <ConfirmDialog
        open={activateOpen}
        onClose={() => setActivateOpen(false)}
        title="Activate version"
        message="Activating this draft will archive the current ACTIVE version for this template."
        confirmLabel="Activate"
        onConfirm={() =>
          void activate(version.id).then(() => setActivateOpen(false))
        }
      />
      <ConfirmDialog
        open={archiveOpen}
        onClose={() => setArchiveOpen(false)}
        title="Archive version"
        message={`Archive “${version.title}”? This cannot be re-edited.`}
        confirmLabel="Archive"
        variant="danger"
        onConfirm={() => void archive(version.id).then(() => setArchiveOpen(false))}
      />
    </Stack>
  )
}
