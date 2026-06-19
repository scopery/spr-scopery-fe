'use client'

import Link from 'next/link'
import { CircleArrowOutUpLeft } from 'lucide-react'
import { Typography, Button, Input, Select, Textarea } from '@/shared/ui'
import type { DocumentTemplate } from '../model/document-templates'
import {
  PlateEditorBody,
} from '@/modules/documents/document/ui/editor/PlateEditor'
import { TemplateScopeBadge } from './TemplateScopeBadge'
import { TemplateStatusBadge } from './TemplateStatusBadge'
import { TemplateVariablePanel } from './TemplateVariablePanel'
import { TemplateVariableWarnings } from './TemplateVariableWarnings'
import { useTemplateEditor, DOCUMENT_TYPE_OPTIONS } from '../hooks/useTemplateEditor'

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'decision', label: 'Decision' },
  { value: 'research', label: 'Research' },
  { value: 'requirement', label: 'Requirement' },
  { value: 'summary', label: 'Summary' },
  { value: 'project', label: 'Project' },
]

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
  const editor = useTemplateEditor({ orgId, template, mode, userId, userRole, onSaved })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={backHref} aria-label={backLabel}>
          <CircleArrowOutUpLeft size={20} className="text-neutral-600 hover:text-primary" />
        </Link>
        <Typography variant="small" tone="muted" aria-live="polite">
          {editor.statusLabel}
        </Typography>
        {editor.canEdit && (
          <Button
            variant="primary"
            size="sm"
            loading={editor.loading}
            onClick={() => void editor.handleSave()}
          >
            Save
          </Button>
        )}
        {editor.showPublishActions && (
          <Button
            variant="outline"
            size="sm"
            loading={editor.loading}
            onClick={() => void editor.handlePublishToggle()}
          >
            {template!.is_published && template!.status === 'published' ? 'Unpublish' : 'Publish'}
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
            value={editor.title}
            onChange={(e) => {
              editor.setTitle(e.target.value)
              editor.markUnsaved()
            }}
            readOnly={!editor.canEdit}
            fullWidth
            required
          />
          <Textarea
            label="Description"
            value={editor.description}
            onChange={(e) => {
              editor.setDescription(e.target.value)
              editor.markUnsaved()
            }}
            readOnly={!editor.canEdit}
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
                  value={editor.scope}
                  onValueChange={(v: string) => editor.setScope(v as typeof editor.scope)}
                  options={editor.scopeOptions}
                />
              </div>
            )}
            <div>
              <Typography variant="small" weight="medium" className="mb-1 block">
                Category
              </Typography>
              <Select
                value={editor.category ?? 'general'}
                onValueChange={(v: string) => {
                  editor.setCategory(v)
                  editor.markUnsaved()
                }}
                options={CATEGORY_OPTIONS}
              />
            </div>
            <div>
              <Typography variant="small" weight="medium" className="mb-1 block">
                Document type
              </Typography>
              <Select
                value={editor.documentType}
                onValueChange={(v: string) => {
                  editor.setDocumentType(v as typeof editor.documentType)
                  editor.markUnsaved()
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
                  value={editor.status}
                  onValueChange={(v: string) => editor.setStatus(v as typeof editor.status)}
                  options={[
                    { value: 'draft', label: 'Draft' },
                    { value: 'published', label: 'Published' },
                  ]}
                />
              </div>
            )}
          </div>

          {editor.canEdit && editor.unknownVariables.length > 0 && (
            <TemplateVariableWarnings unknownVariables={editor.unknownVariables} />
          )}
        </div>

        <div className="grid lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {editor.canEdit ? (
              <PlateEditorBody
                ref={editor.editorRef}
                key={template?.id ?? 'new'}
                value={editor.plateValue}
                onChange={(value) => {
                  editor.setPlateValue(value)
                  editor.markUnsaved()
                }}
                placeholder="Start writing template content… Type / for blocks or variables."
                slashExtras={editor.slashExtras}
              />
            ) : (
              <Typography tone="muted" className="p-6">
                You do not have permission to edit this template.
              </Typography>
            )}
          </div>

          {editor.canEdit && editor.variableDefinitions.length > 0 && (
            <TemplateVariablePanel
              variables={editor.variableDefinitions}
              knownKeys={editor.knownVariableKeys}
              onInsert={editor.handleInsertVariable}
              className="border-t border-neutral-200 lg:border-l lg:border-t-0"
            />
          )}
        </div>
      </div>
    </div>
  )
}
