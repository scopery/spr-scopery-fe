'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Button,
  EntityReferencePicker,
  Stack,
  Typography,
  type EntityReferenceOption,
} from '@/shared/ui'
import { useDocumentTypes } from '../hooks/useDocumentTypes'
import { useKnowledgeGraph } from '../hooks/useKnowledgeGraph'

export function KnowledgeGraphView() {
  const { items: types } = useDocumentTypes()
  const [seed, setSeed] = useState<EntityReferenceOption | null>(null)
  const { related, loading, error, loadRelated, clear } = useKnowledgeGraph()

  const options = useMemo<EntityReferenceOption[]>(
    () =>
      types.map((t) => ({
        id: t.id,
        type: 'DOCUMENT_TYPE',
        code: t.code,
        title: t.name,
        status: String(t.status),
      })),
    [types]
  )

  useEffect(() => {
    clear()
  }, [seed?.id, clear])

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <Typography as="h1" size="md" weight="medium">
        Knowledge Graph Explorer
      </Typography>
      <Typography variant="small" tone="muted">
        Select a seed from known document types, then load related entities.
      </Typography>
      <EntityReferencePicker options={options} value={seed} onChange={setSeed} />
      <Button
        disabled={!seed || loading}
        onClick={() => {
          if (seed) void loadRelated(seed.id)
        }}
      >
        Load related
      </Button>
      {error ? <Typography tone="error">{error}</Typography> : null}
      <ul className="divide-y divide-neutral-200 border border-neutral-200">
        {related.map((r) => (
          <li key={r.id} className="p-sm">
            <Typography variant="small" weight="medium">
              {r.title}
            </Typography>
            <Typography variant="caption" tone="muted">
              {r.type}
            </Typography>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
