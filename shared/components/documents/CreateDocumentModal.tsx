'use client'

import { useState, useEffect } from 'react'
import { Modal, Input, Select, Typography, Button } from '@/shared/ui'
import {
  DOCUMENT_TYPE_OPTIONS,
  DOCUMENT_VISIBILITY_OPTIONS,
  type DocumentType,
  type DocumentVisibility,
} from '@/types/document'
import type { DocumentTemplate, TemplateVariablePreview } from '@/types/document-template'
import * as documentsService from '@/services/documents.service'
import * as documentTemplatesService from '@/services/document-templates.service'
import { TemplatePicker } from '@/shared/components/document-templates/TemplatePicker'
import { TemplateVariableWarnings } from '@/shared/components/document-templates/variables/TemplateVariableWarnings'
import { extractVariablesFromContent } from '@/lib/template-variables/extract-template-variables'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'
import { cn } from '@/utils'

type CreateMode = 'blank' | 'template'

interface CreateDocumentModalProps {
  orgId: string
  projectId: string
  open: boolean
  onClose: () => void
  onSuccess: (documentId: string) => void
  sectionId?: string | null
  canCreateFromTemplate?: boolean
}

export function CreateDocumentModal({
  orgId,
  projectId,
  open,
  onClose,
  onSuccess,
  sectionId,
  canCreateFromTemplate = true,
}: CreateDocumentModalProps) {
  const [mode, setMode] = useState<CreateMode>('blank')
  const [title, setTitle] = useState('')
  const [documentType, setDocumentType] = useState<DocumentType>('note')
  const [visibility, setVisibility] = useState<DocumentVisibility>('project')
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null)
  const [loading, setLoading] = useState(false)
  const [variablePreview, setVariablePreview] = useState<TemplateVariablePreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  useEffect(() => {
    if (!open) {
      setMode('blank')
      setTitle('')
      setDocumentType('note')
      setVisibility('project')
      setSelectedTemplate(null)
      setVariablePreview(null)
    }
  }, [open])

  useEffect(() => {
    if (selectedTemplate) {
      setDocumentType(selectedTemplate.document_type)
      if (!title.trim()) {
        setTitle(selectedTemplate.title)
      }
    }
  }, [selectedTemplate, title])

  useEffect(() => {
    if (mode !== 'template' || !selectedTemplate) {
      setVariablePreview(null)
      return
    }

    setPreviewLoading(true)
    void documentTemplatesService
      .previewTemplateVariables(orgId, selectedTemplate.id, {
        project_id: projectId,
        document_title: title.trim() || selectedTemplate.title,
        mode: 'create_document',
      })
      .then(setVariablePreview)
      .catch(() => setVariablePreview(null))
      .finally(() => setPreviewLoading(false))
  }, [mode, selectedTemplate, orgId, projectId, title])

  const templateHasVariables =
    selectedTemplate != null &&
    extractVariablesFromContent(selectedTemplate.content, selectedTemplate.title).length > 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (mode === 'template' && !selectedTemplate) {
      toast.error('Select a template')
      return
    }

    setLoading(true)
    try {
      let doc
      if (mode === 'template' && selectedTemplate) {
        doc = await documentTemplatesService.createDocumentFromTemplateInProject(orgId, projectId, {
          template_id: selectedTemplate.id,
          title: title.trim(),
          document_type: documentType,
          visibility,
          section_id: sectionId ?? null,
        })
      } else {
        const content = { format: 'plate' as const, value: [{ type: 'p', children: [{ text: '' }] }] }
        doc = await documentsService.createProjectDocument(orgId, projectId, {
          title: title.trim(),
          content,
          document_type: documentType,
          visibility,
          section_id: sectionId ?? null,
        })
      }
      toast.success('Document created')
      onSuccess(doc.id)
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Failed to create document'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New document"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Create', onClick: handleSubmit, variant: 'primary', loading },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Typography variant="small" tone="muted">
          Create a blank document{canCreateFromTemplate ? ' or start from a template' : ''}.
        </Typography>

        <div className="flex gap-2" role="group" aria-label="Creation mode">
          <Button
            type="button"
            variant={mode === 'blank' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => {
              setMode('blank')
              setSelectedTemplate(null)
            }}
          >
            Blank document
          </Button>
          {canCreateFromTemplate && (
            <Button
              type="button"
              variant={mode === 'template' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setMode('template')}
            >
              From template
            </Button>
          )}
        </div>

        {mode === 'template' && (
          <div className={cn('border-t border-neutral-200 pt-4')}>
            <TemplatePicker
              orgId={orgId}
              selectedId={selectedTemplate?.id}
              onSelect={setSelectedTemplate}
            />
          </div>
        )}

        {mode === 'template' && selectedTemplate && templateHasVariables && (
          <div className="space-y-2">
            <Typography variant="small" tone="muted">
              {previewLoading
                ? 'Checking template variables…'
                : 'Variables will be resolved using this project when the document is created.'}
            </Typography>
            {variablePreview && (
              <TemplateVariableWarnings
                unknownVariables={variablePreview.unresolved_variables}
                warnings={variablePreview.warnings}
              />
            )}
          </div>
        )}

        <Input
          label="Title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Document title"
          fullWidth
        />

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Type
          </Typography>
          <Select
            value={documentType}
            onValueChange={(v: string) => setDocumentType(v as DocumentType)}
            options={DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>

        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Visibility
          </Typography>
          <Select
            value={visibility}
            onValueChange={(v: string) => setVisibility(v as DocumentVisibility)}
            options={DOCUMENT_VISIBILITY_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
          />
        </div>
      </form>
    </Modal>
  )
}
