'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Button, Input, PageSkeleton, Stack, Typography } from '@/shared/ui'

import * as api from '../api/document-workbench.api'
import type { DocumentTemplate } from '../api/document-workbench.api'

export function useWorkspaceDocumentTemplates(workspaceId: string | null) {
  const [items, setItems] = useState<DocumentTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!workspaceId) return
    setLoading(true)
    setError(null)
    try {
      const res = await api.listDocumentTemplates(workspaceId)
      setItems(res.items)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [workspaceId])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(
    async (code: string, name: string) => {
      if (!workspaceId) return
      await api.createDocumentTemplate(workspaceId, { code, name })
      await load()
    },
    [workspaceId, load]
  )

  return { items, loading, error, refetch: load, create }
}

export function WorkspaceDocumentTemplatesView() {
  const { workspaceId } = useParams<{ workspaceId: string }>()
  const { items, loading, error, create } = useWorkspaceDocumentTemplates(workspaceId)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="border-b border-neutral-200 pb-2">
        <Typography as="h1" size="md" weight="medium">
          Document templates
        </Typography>
      </div>
      <div className="flex flex-wrap gap-sm">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Code"
          aria-label="Template code"
        />
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          aria-label="Template name"
        />
        <Button
          disabled={!code.trim() || !name.trim()}
          onClick={() => {
            void create(code.trim(), name.trim()).then(() => {
              setCode('')
              setName('')
            })
          }}
        >
          Create
        </Button>
      </div>
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {items.map((t) => (
          <li key={t.id} className="p-md">
            <Typography variant="small" weight="medium">
              {t.name}
            </Typography>
            <Typography variant="caption" tone="muted">
              {[t.code, t.category].filter(Boolean).join(' · ')}
            </Typography>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
