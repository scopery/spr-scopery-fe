'use client'

import { useEffect, useState } from 'react'
import { Button, Input, Stack, Typography } from '@/shared/ui'
import { FEATURES } from '@/config/features'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { plateValueToAst } from '../model/ast-adapter'
import type { Value } from 'platejs'
import * as nativeTemplateApi from '../api/native-template.api'
import * as workbenchApi from '@/modules/documents/document-hub/api/document-workbench.api'
import type { DocumentTemplate } from '@/modules/documents/document-hub/api/document-workbench.api'

/**
 * Publish current editor AST as a native template version, and instantiate into this document.
 */
export function NativeTemplatePublishPanel({
  workspaceId,
  projectId,
  documentId,
  editorValue,
  onInstantiated,
}: {
  workspaceId: string
  projectId: string
  documentId: string
  editorValue: Value
  onInstantiated?: () => void
}) {
  const [templates, setTemplates] = useState<DocumentTemplate[]>([])
  const [templateId, setTemplateId] = useState('')
  const [lastVersionId, setLastVersionId] = useState('')
  const [versionIdInput, setVersionIdInput] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [instantiating, setInstantiating] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!FEATURES.wave41NativeTemplates) return
    let cancelled = false
    void (async () => {
      setLoading(true)
      try {
        const res = await workbenchApi.listDocumentTemplates(workspaceId)
        if (cancelled) return
        setTemplates(res.items)
        setTemplateId((prev) => prev || res.items[0]?.id || '')
      } catch (err) {
        if (!cancelled) toast.error(getProblemToastMessage(err))
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [workspaceId])

  if (!FEATURES.wave41NativeTemplates) {
    return (
      <Stack direction="vertical" spacing="xs" className="border border-neutral-200 p-sm">
        <Typography variant="h4">Native templates</Typography>
        <Typography variant="caption" tone="muted">
          Enable FEATURES.wave41NativeTemplates to publish/instantiate native template versions.
        </Typography>
      </Stack>
    )
  }

  const activeVersionId = versionIdInput.trim() || lastVersionId

  return (
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <Typography variant="h4">Native templates</Typography>
      <Typography variant="caption" tone="muted">
        Publish the current editor AST as a native version, or instantiate a version into this
        document.
      </Typography>
      {loading ? (
        <Typography variant="caption" tone="muted">
          Loading templates…
        </Typography>
      ) : null}
      <select
        className="w-full border border-neutral-200 bg-surface px-sm py-xs text-sm"
        value={templateId}
        onChange={(e) => setTemplateId(e.target.value)}
        aria-label="Template"
        disabled={!templates.length}
      >
        {!templates.length ? <option value="">No templates</option> : null}
        {templates.map((t) => (
          <option key={t.id} value={t.id}>
            {t.name} ({t.code})
          </option>
        ))}
      </select>
      <Button
        size="sm"
        disabled={!templateId || publishing}
        onClick={() => {
          void (async () => {
            setPublishing(true)
            try {
              const version = await nativeTemplateApi.publishNativeTemplateVersion(
                workspaceId,
                templateId,
                {
                  ast: plateValueToAst(editorValue),
                  variables: [],
                }
              )
              const id = String((version as { id?: string }).id ?? '')
              if (id) {
                setLastVersionId(id)
                setVersionIdInput(id)
              }
              toast.success('Native template version published')
            } catch (err) {
              toast.error(getProblemToastMessage(err))
            } finally {
              setPublishing(false)
            }
          })()
        }}
      >
        Publish from editor
      </Button>

      <Input
        size="sm"
        fullWidth
        value={versionIdInput}
        onChange={(e) => setVersionIdInput(e.target.value)}
        placeholder="Version UUID (from publish)"
        aria-label="Native template version ID"
      />
      <Button
        size="sm"
        variant="outline"
        disabled={!templateId || !activeVersionId || instantiating}
        onClick={() => {
          void (async () => {
            setInstantiating(true)
            try {
              await nativeTemplateApi.instantiateNativeTemplate(
                workspaceId,
                templateId,
                activeVersionId,
                {
                  projectId,
                  targetDocumentId: documentId,
                  variables: {},
                }
              )
              toast.success('Template instantiated into document')
              onInstantiated?.()
            } catch (err) {
              toast.error(getProblemToastMessage(err))
            } finally {
              setInstantiating(false)
            }
          })()
        }}
      >
        Instantiate into this doc
      </Button>
    </Stack>
  )
}
