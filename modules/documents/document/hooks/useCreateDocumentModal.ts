'use client'

import { useEffect, useState } from 'react'
import type { DocumentType, DocumentVisibility } from '../model/document'
import type {
  DocumentTemplate,
  TemplateVariablePreview,
} from '@/modules/documents/document-templates'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import { extractVariablesFromContent } from '@/modules/documents/document-templates/model/template-variables/extract-template-variables'
import * as createDocumentApi from '../api/create-document-modal.api'
import type { CreateDocumentModalProps, CreateDocumentMode } from '../model/create-document-modal'

export function useCreateDocumentModal({
  orgId,
  projectId,
  open,
  onSuccess,
  sectionId,
}: CreateDocumentModalProps) {
  const [mode, setMode] = useState<CreateDocumentMode>('blank')
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
    void createDocumentApi
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

  const handleModeChange = (nextMode: CreateDocumentMode) => {
    setMode(nextMode)
    if (nextMode === 'blank') {
      setSelectedTemplate(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (mode === 'template' && !selectedTemplate) {
      toast.error('Select a template')
      return
    }

    setLoading(true)
    try {
      const doc =
        mode === 'template' && selectedTemplate
          ? await createDocumentApi.createDocumentFromTemplateInProject(orgId, projectId, {
              template_id: selectedTemplate.id,
              title: title.trim(),
              document_type: documentType,
              visibility,
              section_id: sectionId ?? null,
            })
          : await createDocumentApi.createBlankProjectDocument(orgId, projectId, {
              title: title.trim(),
              document_type: documentType,
              visibility,
              section_id: sectionId ?? null,
            })

      toast.success('Document created')
      onSuccess(doc.id)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to create document'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return {
    mode,
    title,
    documentType,
    visibility,
    selectedTemplate,
    loading,
    variablePreview,
    previewLoading,
    templateHasVariables,
    setTitle,
    setDocumentType,
    setVisibility,
    setSelectedTemplate,
    handleModeChange,
    handleSubmit,
  }
}
