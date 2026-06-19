'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Value } from 'platejs'
import type { PlateEditorHandle } from '@/modules/documents/document/ui/editor/PlateEditor'
import { DOCUMENT_TYPE_OPTIONS, type DocumentType } from '@/modules/documents/document'
import type {
  DocumentTemplate,
  TemplateScope,
  TemplateVariableDefinition,
} from '../model/document-templates'
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
} from '@/modules/documents'
import * as documentTemplatesApi from '../api/document-templates.api'
import { buildVariableSlashGroups } from '../model/template-variables/template-variable-slash-items'
import { extractVariablesFromContent } from '../model/template-variables/extract-template-variables'

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error'

interface UseTemplateEditorParams {
  orgId: string
  template?: DocumentTemplate
  mode: 'create' | 'edit'
  userId?: string
  userRole?: string
  onSaved?: (template: DocumentTemplate) => void
}

export function useTemplateEditor({
  orgId,
  template,
  mode,
  userId,
  userRole,
  onSaved,
}: UseTemplateEditorParams) {
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

  const markUnsaved = () => setSaveStatus('unsaved')

  return {
    editorRef,
    isAdmin,
    canEdit,
    title,
    description,
    scope,
    category,
    documentType,
    status,
    plateValue,
    saveStatus,
    loading,
    variableDefinitions,
    knownVariableKeys,
    unknownVariables,
    slashExtras,
    scopeOptions,
    statusLabel,
    showPublishActions,
    setTitle,
    setDescription,
    setScope,
    setCategory,
    setDocumentType,
    setStatus,
    setPlateValue,
    markUnsaved,
    handleInsertVariable,
    handleSave,
    handlePublishToggle,
  }
}

export { DOCUMENT_TYPE_OPTIONS }
