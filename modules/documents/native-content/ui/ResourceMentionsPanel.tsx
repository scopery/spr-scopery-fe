'use client'

import { Button, Input, Stack, Typography } from '@/shared/ui'
import { useResourceMentions } from '../hooks/useResourceMentions'

export function ResourceMentionsPanel({
  onInsertMention,
}: {
  onInsertMention?: (resourceType: string, resourceId: string, label: string) => void
}) {
  const {
    types,
    loadingTypes,
    resourceId,
    setResourceId,
    selectedType,
    setSelectedType,
    resolved,
    resolving,
    resolveOne,
  } = useResourceMentions()

  return (
    <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-sm">
      <Typography variant="h4">Mentions</Typography>
      <Typography variant="caption" tone="muted">
        Resolve a resource and insert a mention token. Mention search is not exposed on BE yet —
        paste a known resource ID.
      </Typography>

      {loadingTypes ? (
        <Typography variant="caption" tone="muted">
          Loading types…
        </Typography>
      ) : null}

      <select
        className="w-full border border-neutral-200 bg-surface px-sm py-xs text-sm"
        value={selectedType}
        onChange={(e) => setSelectedType(e.target.value)}
        aria-label="Resource type"
      >
        {types.map((t) => (
          <option key={t.id} value={t.code}>
            {t.displayName} ({t.code})
          </option>
        ))}
      </select>

      <Input
        size="sm"
        fullWidth
        value={resourceId}
        onChange={(e) => setResourceId(e.target.value)}
        placeholder="Resource UUID"
        aria-label="Resource ID"
      />

      <div className="flex flex-wrap gap-xs">
        <Button size="sm" variant="outline" disabled={resolving || !resourceId.trim()} onClick={() => void resolveOne()}>
          Resolve
        </Button>
        <Button
          size="sm"
          disabled={!resourceId.trim() || !onInsertMention}
          onClick={() => {
            const label =
              resolved?.status === 'RESOLVED' && resolved.displayName
                ? resolved.displayName
                : `${selectedType}:${resourceId.trim().slice(0, 8)}`
            onInsertMention?.(selectedType, resourceId.trim(), label)
          }}
        >
          Insert
        </Button>
      </div>

      {resolved ? (
        <Typography variant="caption" tone="muted">
          {resolved.status}
          {resolved.displayName ? ` · ${resolved.displayName}` : ' · [Access Revoked / Not Found]'}
        </Typography>
      ) : null}
    </Stack>
  )
}
