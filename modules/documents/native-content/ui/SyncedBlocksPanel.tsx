'use client'

import { Button, Input, Stack, Typography } from '@/shared/ui'
import type { Value } from 'platejs'
import { useSyncedBlocks } from '../hooks/useSyncedBlocks'

export function SyncedBlocksPanel({
  workspaceId,
  projectId,
  currentEditorValue,
  onInsertReference,
}: {
  workspaceId: string
  projectId: string
  currentEditorValue?: Value
  onInsertReference?: (syncedBlockId: string, title: string) => void
}) {
  const {
    items,
    loading,
    error,
    title,
    setTitle,
    creating,
    createEmpty,
    createFromEditorValue,
    archive,
  } = useSyncedBlocks(workspaceId, projectId)

  return (
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <Typography variant="h4">Synced blocks</Typography>
      <Typography variant="caption" tone="muted">
        Shared content blocks for this workspace. Insert a live reference into the document.
      </Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}

      <Input
        size="sm"
        fullWidth
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="New synced block title"
        aria-label="Synced block title"
      />
      <div className="flex flex-wrap gap-xs">
        <Button
          size="sm"
          disabled={creating}
          onClick={() => void createEmpty()}
        >
          Create empty
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={creating || !currentEditorValue}
          onClick={() => {
            if (currentEditorValue) void createFromEditorValue(currentEditorValue)
          }}
        >
          From editor
        </Button>
      </div>

      {loading && !items.length ? (
        <Typography variant="caption" tone="muted">
          Loading…
        </Typography>
      ) : null}
      {!loading && !items.length ? (
        <Typography variant="caption" tone="muted">
          No synced blocks yet.
        </Typography>
      ) : null}

      <ul className="divide-y divide-neutral-200">
        {items.map((b) => (
          <li key={b.id} className="flex flex-col gap-xs py-xs text-sm">
            <div>
              <Typography variant="small" weight="medium">
                {b.title}
              </Typography>
              <Typography variant="caption" tone="muted">
                rev {b.currentRevisionNo} · {b.status}
              </Typography>
            </div>
            <div className="flex gap-xs">
              {onInsertReference ? (
                <Button size="sm" variant="outline" onClick={() => onInsertReference(b.id, b.title)}>
                  Insert
                </Button>
              ) : null}
              <Button size="sm" variant="ghost" onClick={() => void archive(b.id)}>
                Archive
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
