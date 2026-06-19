'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import type { Value } from 'platejs'
import { CircleArrowOutUpLeft } from 'lucide-react'
import { Typography, Button, Input, Select, Textarea } from '@/shared/ui'
import { DOCUMENT_TYPE_OPTIONS, type DocumentType } from '@/modules/documents/document'
import type {
  DocumentTemplate,
  TemplateScope,
  TemplateVariableDefinition,
} from '../model/document-templates'
import {
  PlateEditorBody,
  type PlateEditorHandle,
} from '@/modules/documents/document/ui/editor/PlateEditor'
import {
  contentToPlateValue,
  plateValueToContent,
} from '@/modules/documents/document/ui/editor/content-adapter'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import {
  allowedCreateScopes,
  canEditTemplate,
  canPublishTemplate,
  isPlatformAdmin,
} from '@/utils/template-permissions'
import * as documentTemplatesApi from '../api/document-templates.api'
import { TemplateScopeBadge } from './TemplateScopeBadge'
import { TemplateStatusBadge } from './TemplateStatusBadge'
import { TemplateVariablePanel } from './TemplateVariablePanel'
import { TemplateVariableWarnings } from './TemplateVariableWarnings'
import { buildVariableSlashGroups } from '../model/template-variables/template-variable-slash-items'
import { extractVariablesFromContent } from '../model/template-variables/extract-template-variables'

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'decision', label: 'Decision' },
  { value: 'research', label: 'Research' },
  { value: 'requirement', label: 'Requirement' },
  { value: 'summary', label: 'Summary' },
  { value: 'project', label: 'Project' },
]

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

export interface TemplateEditorProps {
  orgId: string
  template?: DocumentTemplate
  mode: 'create' | 'edit'
  userId?: string
  userRole?: string
  backHref: string
  backLabel?: string
  onSaved?: (template: DocumentTemplate) => void
}

export function TemplateEditor({
  orgId,
  template,
  mode,
  userId,
  userRole,
  backHref,
  backLabel = 'Back to templates',
  onSaved,
}: TemplateEditorProps) {
  const isAdmin = isPlatformAdmin(userRole)
  const canEdit =
    mode === 'create' || (template ? canEditTemplate(template, userId, isAdmin) : false)
  const editorRef = useRef<PlateEditorHandle>(null)

  const [title, setTitle] = useState(template?.title ?? '')
  const [description, setDescription] = useState(template?.description ?? '')
  const [scope, setScope] = useState<TemplateScope>(
    template?.scope ?? (isAdmin ? 'personal' : 'personal')
  )
  const [category, setCategory] = useState(template?.category ?? 'general')
  const [documentType, setDocumentType] = useState<DocumentType>(template?.document_type ?? 'note')
  const [status, setStatus] = useState<'draft' | 'published'>(
    template?.status === 'published' ? 'published' : 'draft'
  )
  const [plateValue, setPlateValue] = useState<Value>(() =>
    contentToPlateValue(
      template?.content ?? { format: 'plate', value: [{ type: 'p', children: [{ text: '' }] }] }
    )
  )
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [loading, setLoading] = useState(false)
  const [variableDefinitions, setVariableDefinitions] = useState<TemplateVariableDefinition[]>([])

  useEffect(() => {
    void documentTemplatesApi
      .listTemplateVariables(orgId)
      .then(setVariableDefinitions)
      .catch(() => {
        setVariableDefinitions([])
      })
  }, [orgId])

  const knownVariableKeys = useMemo(
    () => new Set(variableDefinitions.map((variable) => variable.key)),
    [variableDefinitions]
  )

  const detectedVariables = useMemo(
    () => extractVariablesFromContent(plateValueToContent(plateValue), title),
    [plateValue, title]
  )

  const unknownVariables = useMemo(
    () => detectedVariables.filter((key) => !knownVariableKeys.has(key)),
    [detectedVariables, knownVariableKeys]
  )

  const slashExtras = useMemo(
    () => (canEdit ? buildVariableSlashGroups(variableDefinitions) : []),
    [canEdit, variableDefinitions]
  )

  const scopeOptions = useMemo(
    () =>
      allowedCreateScopes(isAdmin).map((s) => ({
        value: s,
        label: s === 'system' ? 'System' : 'Personal',
      })),
    [isAdmin]
  )

  const handleInsertVariable = useCallback((token: string) => {
    editorRef.current?.insertText(token)
    setSaveStatus('unsaved')
  }, [])

  const handleSave = useCallback(async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }

    setLoading(true)
    setSaveStatus('saving')

    try {
      let saved: DocumentTemplate
      if (mode === 'create') {
        saved = await documentTemplatesApi.createTemplate(orgId, {
          title: title.trim(),
          description: description.trim() || null,
          scope: scope as 'personal' | 'system',
          category: category || null,
          document_type: documentType,
          content: plateValueToContent(plateValue),
          status,
        })
        toast.success('Template created')
      } else if (template) {
        saved = await documentTemplatesApi.updateTemplate(orgId, template.id, {
          title: title.trim(),
          description: description.trim() || null,
          category: category || null,
          document_type: documentType,
          content: plateValueToContent(plateValue),
          status,
        })
        toast.success('Template saved')
      } else {
        return
      }
      setSaveStatus('saved')
      onSaved?.(saved)
    } catch (err) {
      setSaveStatus('error')
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to save'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }, [
    orgId,
    mode,
    template,
    title,
    description,
    scope,
    category,
    documentType,
    plateValue,
    status,
    onSaved,
  ])

  const handlePublishToggle = async () => {
    if (!template) return
    setLoading(true)
    try {
      const updated =
        template.is_published && template.status === 'published'
          ? await documentTemplatesApi.unpublishTemplate(orgId, template.id)
          : await documentTemplatesApi.publishTemplate(orgId, template.id)
      setStatus(updated.status === 'published' ? 'published' : 'draft')
      toast.success(updated.is_published ? 'Template published' : 'Template unpublished')
      onSaved?.(updated)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Action failed'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  const statusLabel = useMemo(() => {
    switch (saveStatus) {
      case 'saved':
        return 'Saved'
      case 'saving':
        return 'Saving…'
      case 'unsaved':
        return 'Unsaved changes'
      case 'error':
        return 'Error saving'
    }
  }, [saveStatus])

  const showPublishActions = template && canPublishTemplate(template, userId, isAdmin)

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={backHref} aria-label={backLabel}>
          <CircleArrowOutUpLeft size={20} className="text-neutral-600 hover:text-primary" />
        </Link>
        <Typography variant="small" tone="muted" aria-live="polite">
          {statusLabel}
        </Typography>
        {canEdit && (
          <Button variant="primary" size="sm" loading={loading} onClick={() => void handleSave()}>
            Save
          </Button>
        )}
        {showPublishActions && (
          <Button
            variant="outline"
            size="sm"
            loading={loading}
            onClick={() => void handlePublishToggle()}
          >
            {template.is_published && template.status === 'published' ? 'Unpublish' : 'Publish'}
          </Button>
        )}
      </div>

      {template && (
        <div className="mb-4 flex flex-wrap gap-2">
          <TemplateScopeBadge scope={template.scope} />
          <TemplateStatusBadge status={template.status} isPublished={template.is_published} />
        </div>
      )}

      <div className="border border-neutral-200 bg-white">
        <div className="space-y-4 border-b border-neutral-200 p-6">
          <Input
            label="Title"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value)
              setSaveStatus('unsaved')
            }}
            readOnly={!canEdit}
            fullWidth
            required
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value)
              setSaveStatus('unsaved')
            }}
            readOnly={!canEdit}
            rows={2}
            fullWidth
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {mode === 'create' && (
              <div>
                <Typography variant="small" weight="medium" className="mb-1 block">
                  Scope
                </Typography>
                <Select
                  value={scope}
                  onValueChange={(v: string) => setScope(v as TemplateScope)}
                  options={scopeOptions}
                />
              </div>
            )}
            <div>
              <Typography variant="small" weight="medium" className="mb-1 block">
                Category
              </Typography>
              <Select
                value={category ?? 'general'}
                onValueChange={(v: string) => {
                  setCategory(v)
                  setSaveStatus('unsaved')
                }}
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div>
              <Typography variant="small" weight="medium" className="mb-1 block">
                Document type
              </Typography>
              <Select
                value={documentType}
                onValueChange={(v: string) => {
                  setDocumentType(v as DocumentType)
                  setSaveStatus('unsaved')
                }}
                options={DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
              />
            </div>
            {mode === 'create' && (
              <div>
                <Typography variant="small" weight="medium" className="mb-1 block">
                  Initial status
                </Typography>
                <Select
                  value={status}
                  onValueChange={(v: string) => setStatus(v as 'draft' | 'published')}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                  ]}
                />
              </div>
            )}
          </div>

          {canEdit && unknownVariables.length > 0 && (
            <TemplateVariableWarnings unknownVariables={unknownVariables} />
          )}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {canEdit ? (
              <PlateEditorBody
                ref={editorRef}
                key={template?.id ?? 'new'}
                value={plateValue}
                onChange={(value) => {
                  setPlateValue(value)
                  setSaveStatus('unsaved')
                }}
                placeholder="Start writing template content… Type / for blocks or variables."
                slashExtras={slashExtras}
              />
            ) : (
              <Typography tone="muted" className="p-6">
                You do not have permission to edit this template.
              </Typography>
            )}
          </div>

          {canEdit && variableDefinitions.length > 0 && (
            <TemplateVariablePanel
              variables={variableDefinitions}
              knownKeys={knownVariableKeys}
              onInsert={handleInsertVariable}
              className="border-t border-neutral-200 lg:border-l lg:border-t-0"
            />
          )}
        </div>
      </div>
    </div>
  )
}
