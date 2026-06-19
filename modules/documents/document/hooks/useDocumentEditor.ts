'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Value } from 'platejs'
import { toast } from 'sonner'
import {
  DOCUMENT_WORKFLOW_STATUS_OPTIONS,
  WORKFLOW_TRANSITIONS,
  type Document,
  type DocumentType,
  type DocumentVisibility,
  type DocumentWorkflowStatus,
} from '../model/document'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import * as documentDetailApi from '../api/document-detail.api'
import type { SaveStatus } from '../model/document-editor'
import { contentToPlateValue, plateValueToContent } from '../ui/editor/content-adapter'

const AUTOSAVE_MS = 1000

interface UseDocumentEditorOptions {
  orgId: string
  projectId?: string
  document: Document
  canEdit: boolean
  canExport?: boolean
  backHref: string
  onArchived?: () => void
}

export function useDocumentEditor({
  orgId,
  projectId,
  document: initialDoc,
  canEdit,
  canExport = true,
  backHref,
  onArchived,
}: UseDocumentEditorOptions) {
  const router = useRouter()
  const [title, setTitle] = useState(initialDoc.title)
  const [plateValue, setPlateValue] = useState<Value>(() => contentToPlateValue(initialDoc.content))
  const [documentType, setDocumentType] = useState<DocumentType>(initialDoc.document_type)
  const [visibility, setVisibility] = useState<DocumentVisibility>(initialDoc.visibility)
  const [workflowStatus, setWorkflowStatus] = useState<DocumentWorkflowStatus>(
    initialDoc.workflow_status ?? 'draft'
  )
  const [updatedAt, setUpdatedAt] = useState(initialDoc.updated_at)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [archiving, setArchiving] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const [exporting, setExporting] = useState(false)

  const saveTokenRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const payloadRef = useRef({
    title: initialDoc.title,
    plateValue: contentToPlateValue(initialDoc.content),
    documentType: initialDoc.document_type,
    visibility: initialDoc.visibility,
    workflowStatus: initialDoc.workflow_status ?? 'draft',
  })

  useEffect(() => {
    payloadRef.current = { title, plateValue, documentType, visibility, workflowStatus }
  }, [title, plateValue, documentType, visibility, workflowStatus])

  const performSave = useCallback(
    async (source: 'manual' | 'autosave') => {
      if (!canEdit) return

      const token = ++saveTokenRef.current
      const snapshot = { ...payloadRef.current }

      if (!snapshot.title.trim()) {
        setSaveStatus('error')
        toast.error('Title is required')
        return
      }

      setSaveStatus('saving')

      try {
        const saved = await documentDetailApi.updateDocument(
          orgId,
          initialDoc.id,
          {
            title: snapshot.title.trim(),
            content: plateValueToContent(snapshot.plateValue),
            document_type: snapshot.documentType,
            visibility: snapshot.visibility,
            workflow_status: snapshot.workflowStatus,
          },
          projectId
        )

        if (token !== saveTokenRef.current) return

        setUpdatedAt(saved.updated_at)
        setSaveStatus('saved')
        if (source === 'manual') toast.success('Document saved')
      } catch (err) {
        if (token !== saveTokenRef.current) return
        setSaveStatus('error')
        toast.error(getProblemToastMessage(err))
      }
    },
    [canEdit, orgId, initialDoc.id, projectId]
  )

  const scheduleAutosave = useCallback(() => {
    if (!canEdit) return
    setSaveStatus('unsaved')
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      void performSave('autosave')
    }, AUTOSAVE_MS)
  }, [canEdit, performSave])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleManualSave = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    void performSave('manual')
  }

  const handleArchive = async () => {
    setArchiving(true)
    try {
      await documentDetailApi.archiveDocument(orgId, initialDoc.id, projectId)
      toast.success('Document archived')
      setArchiveOpen(false)
      if (onArchived) {
        onArchived()
      } else {
        router.push(backHref)
      }
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setArchiving(false)
    }
  }

  const handleRestore = async () => {
    setRestoring(true)
    try {
      await documentDetailApi.restoreDocument(orgId, initialDoc.id, projectId)
      toast.success('Document restored')
      router.refresh()
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setRestoring(false)
    }
  }

  const handleExport = async () => {
    if (!canExport) return
    setExporting(true)
    try {
      await documentDetailApi.downloadSingleDocumentExport(orgId, initialDoc.id, {
        format: 'markdown',
        project_id: projectId,
      })
      toast.success('Export downloaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : getProblemToastMessage(err))
    } finally {
      setExporting(false)
    }
  }

  const workflowOptions = useMemo(() => {
    const allowed = WORKFLOW_TRANSITIONS[workflowStatus] ?? []
    const options = DOCUMENT_WORKFLOW_STATUS_OPTIONS.filter(
      (o) => o.value === workflowStatus || allowed.includes(o.value)
    )
    return options.map((o) => ({ value: o.value, label: o.label }))
  }, [workflowStatus])

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

  return {
    title,
    setTitle,
    plateValue,
    setPlateValue,
    documentType,
    setDocumentType,
    visibility,
    setVisibility,
    workflowStatus,
    setWorkflowStatus,
    updatedAt,
    saveStatus,
    archiveOpen,
    setArchiveOpen,
    archiving,
    restoring,
    exporting,
    workflowOptions,
    statusLabel,
    scheduleAutosave,
    handleManualSave,
    handleArchive,
    handleRestore,
    handleExport,
  }
}
