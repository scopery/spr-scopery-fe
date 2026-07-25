'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Value } from 'platejs'
import { toast } from 'sonner'
import { ApiError, getProblemCode } from '@/shared/lib/api-types'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { emptyPlateValue } from '@/modules/documents/document/ui/editor/empty-plate-value'
import * as workbenchApi from '@/modules/documents/document-hub/api/document-workbench.api'
import { DocumentContentGateway } from '../api/document-content.gateway'
import {
  CONTENT_OPTIMISTIC_LOCK_CONFLICT,
  DOCUMENT_NATIVE_CONTENT_NOT_SUPPORTED,
  DocumentContentMode,
  ContentRevisionType,
  type DocumentContentMode as ContentMode,
  type NativeEditorSaveStatus,
} from '../model/document-content'

/** Idle debounce before autosave. Edits reset the timer; no continuous saves. */
const AUTOSAVE_MS = 30_000

function isNativeContentUnsupported(err: unknown): boolean {
  const code = getProblemCode(err)
  return (
    err instanceof ApiError &&
    err.status === 409 &&
    code === DOCUMENT_NATIVE_CONTENT_NOT_SUPPORTED
  )
}

export function useNativeDocumentEditor(projectId: string, documentId: string) {
  const [title, setTitle] = useState('')
  const [documentStatus, setDocumentStatus] = useState<string | null>(null)
  const [contentMode, setContentMode] = useState<ContentMode | string | null>(null)
  const [nativeUnsupported, setNativeUnsupported] = useState(false)
  const [plateValue, setPlateValue] = useState<Value>(emptyPlateValue)
  const [revisionNo, setRevisionNo] = useState(0)
  const [schemaVersion, setSchemaVersion] = useState(1)
  const [saveStatus, setSaveStatus] = useState<NativeEditorSaveStatus>('idle')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [conflictServerValue, setConflictServerValue] = useState<Value | null>(null)
  const [conflictServerRevision, setConflictServerRevision] = useState<number | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>()

  const saveTokenRef = useRef(0)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const autosaveDueAtRef = useRef<number | null>(null)
  const payloadRef = useRef({ plateValue: emptyPlateValue() as Value, revisionNo: 0 })
  const nativeUnsupportedRef = useRef(false)
  const [autosaveInSeconds, setAutosaveInSeconds] = useState<number | null>(null)

  const clearAutosaveTimer = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = null
    autosaveDueAtRef.current = null
    setAutosaveInSeconds(null)
  }, [])

  const load = useCallback(async () => {
    setLoading(true)
    setLoadError(null)
    setNativeUnsupported(false)
    nativeUnsupportedRef.current = false
    try {
      const doc = await workbenchApi.getProjectDocument(projectId, documentId)
      setTitle(doc.title)
      setDocumentStatus(doc.status ?? null)
      const mode = (doc.contentMode ?? null) as ContentMode | string | null
      setContentMode(mode)

      const isFileOnly = mode === DocumentContentMode.File
      if (isFileOnly) {
        nativeUnsupportedRef.current = true
        setNativeUnsupported(true)
        const empty = emptyPlateValue()
        setPlateValue(empty)
        setRevisionNo(0)
        payloadRef.current = { plateValue: empty, revisionNo: 0 }
        setSaveStatus('error')
        setLoading(false)
        return
      }

      let content = null
      try {
        content = await DocumentContentGateway.getEditableContent(projectId, documentId)
      } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
          content = null
        } else if (isNativeContentUnsupported(err)) {
          nativeUnsupportedRef.current = true
          setNativeUnsupported(true)
          setSaveStatus('error')
          setLoading(false)
          return
        } else {
          throw err
        }
      }

      if (content) {
        setPlateValue(content.value)
        setRevisionNo(content.revisionNo)
        setSchemaVersion(content.schemaVersion)
        setLastSavedAt(content.lastSavedAt)
        payloadRef.current = { plateValue: content.value, revisionNo: content.revisionNo }
      } else {
        const empty = emptyPlateValue()
        setPlateValue(empty)
        setRevisionNo(0)
        payloadRef.current = { plateValue: empty, revisionNo: 0 }
      }
      setSaveStatus('saved')
    } catch (err) {
      setLoadError(err instanceof Error ? err.message : 'Failed to load document')
    } finally {
      setLoading(false)
    }
  }, [projectId, documentId])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    payloadRef.current = { plateValue, revisionNo }
  }, [plateValue, revisionNo])

  const performSave = useCallback(
    async (source: 'manual' | 'autosave') => {
      if (nativeUnsupportedRef.current) {
        setSaveStatus('error')
        if (source === 'manual') {
          toast.error(
            'This document is FILE mode — native editor cannot save it. Create a new NATIVE document instead.'
          )
        }
        return
      }

      const token = ++saveTokenRef.current
      const snapshot = { ...payloadRef.current }
      setSaveStatus('saving')

      try {
        const saved = await DocumentContentGateway.saveEditableContent(projectId, documentId, {
          value: snapshot.plateValue,
          expectedBaseRevisionNo: snapshot.revisionNo,
          schemaVersion,
          revisionType:
            source === 'autosave'
              ? ContentRevisionType.AutosaveCheckpoint
              : ContentRevisionType.Manual,
        })

        if (token !== saveTokenRef.current) return

        setRevisionNo(saved.revisionNo)
        setLastSavedAt(saved.lastSavedAt)
        payloadRef.current = { plateValue: snapshot.plateValue, revisionNo: saved.revisionNo }
        setConflictServerValue(null)
        setConflictServerRevision(null)
        // Pending debounce means newer edits arrived during this save — keep unsaved.
        setSaveStatus(debounceRef.current ? 'unsaved' : 'saved')
        if (source === 'manual') toast.success('Document saved')
      } catch (err) {
        if (token !== saveTokenRef.current) return

        if (isNativeContentUnsupported(err)) {
          nativeUnsupportedRef.current = true
          setNativeUnsupported(true)
          clearAutosaveTimer()
          setSaveStatus('error')
          toast.error(
            'This document is FILE mode — native content is not supported. Create a NATIVE document to edit text.'
          )
          return
        }

        const code = getProblemCode(err)
        const isConflict =
          err instanceof ApiError &&
          err.status === 409 &&
          (code === CONTENT_OPTIMISTIC_LOCK_CONFLICT || !code)

        if (isConflict) {
          clearAutosaveTimer()
          setSaveStatus('conflict')
          try {
            const server = await DocumentContentGateway.getEditableContent(projectId, documentId)
            setConflictServerValue(server.value)
            setConflictServerRevision(server.revisionNo)
          } catch {
            // keep conflict state without server preview
          }
          return
        }

        setSaveStatus('error')
        toast.error(getProblemToastMessage(err))
      }
    },
    [projectId, documentId, schemaVersion, clearAutosaveTimer]
  )

  const scheduleAutosave = useCallback(() => {
    if (nativeUnsupportedRef.current) {
      setSaveStatus('error')
      return
    }
    setSaveStatus((prev) => (prev === 'conflict' ? prev : 'unsaved'))
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const dueAt = Date.now() + AUTOSAVE_MS
    autosaveDueAtRef.current = dueAt
    setAutosaveInSeconds(Math.ceil(AUTOSAVE_MS / 1000))
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null
      autosaveDueAtRef.current = null
      setAutosaveInSeconds(null)
      void performSave('autosave')
    }, AUTOSAVE_MS)
  }, [performSave])

  useEffect(() => {
    if (saveStatus !== 'unsaved' || autosaveDueAtRef.current == null) return
    const tick = () => {
      const due = autosaveDueAtRef.current
      if (due == null) {
        setAutosaveInSeconds(null)
        return
      }
      setAutosaveInSeconds(Math.max(0, Math.ceil((due - Date.now()) / 1000)))
    }
    tick()
    const id = setInterval(tick, 250)
    return () => clearInterval(id)
  }, [saveStatus])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const handleManualSave = useCallback(() => {
    clearAutosaveTimer()
    void performSave('manual')
  }, [clearAutosaveTimer, performSave])

  const renameTitle = useCallback(
    async (nextTitle: string): Promise<boolean> => {
      const trimmed = nextTitle.trim()
      if (!trimmed) {
        toast.error('Title is required')
        return false
      }
      if (trimmed === title) return true
      try {
        const updated = await workbenchApi.updateProjectDocument(projectId, documentId, {
          title: trimmed,
        })
        setTitle(updated.title)
        toast.success('Title updated')
        return true
      } catch (err) {
        toast.error(getProblemToastMessage(err))
        return false
      }
    },
    [projectId, documentId, title]
  )

  const onPlateChange = useCallback(
    (value: Value) => {
      setPlateValue(value)
      scheduleAutosave()
    },
    [scheduleAutosave]
  )

  const keepLocalAndRetry = useCallback(() => {
    if (conflictServerRevision == null) return
    setRevisionNo(conflictServerRevision)
    payloadRef.current = {
      plateValue: payloadRef.current.plateValue,
      revisionNo: conflictServerRevision,
    }
    setConflictServerValue(null)
    setConflictServerRevision(null)
    void performSave('manual')
  }, [conflictServerRevision, performSave])

  const loadServerVersion = useCallback(() => {
    if (conflictServerValue == null || conflictServerRevision == null) return
    setPlateValue(conflictServerValue)
    setRevisionNo(conflictServerRevision)
    payloadRef.current = {
      plateValue: conflictServerValue,
      revisionNo: conflictServerRevision,
    }
    setConflictServerValue(null)
    setConflictServerRevision(null)
    setSaveStatus('saved')
  }, [conflictServerValue, conflictServerRevision])

  const statusLabel = (() => {
    if (nativeUnsupported) return 'Read-only — FILE mode'
    switch (saveStatus) {
      case 'idle':
        return ''
      case 'saved':
        return 'Saved'
      case 'saving':
        return 'Saving…'
      case 'unsaved':
        return autosaveInSeconds != null
          ? `Autosave in ${autosaveInSeconds}s`
          : 'Unsaved changes'
      case 'conflict':
        return 'Conflict — content changed elsewhere'
      case 'error':
        return 'Error saving'
    }
  })()

  return {
    title,
    documentStatus,
    contentMode,
    nativeUnsupported,
    plateValue,
    revisionNo,
    saveStatus,
    statusLabel,
    autosaveInSeconds,
    loading,
    loadError,
    lastSavedAt,
    conflictServerValue,
    onPlateChange,
    handleManualSave,
    renameTitle,
    keepLocalAndRetry,
    loadServerVersion,
    refetch: load,
  }
}
