'use client'

import { useState } from 'react'
import { Button, ConfirmDialog, PageSkeleton, Typography } from '@/shared/ui'
import { useScreenComponents } from '../hooks/useScreenComponents'
import type { SpecCatalogComponent } from './FieldSpecDrawer'

export function ScreenLinkedComponentsPanel({
  workspaceId,
  screenId,
  components,
  onChanged,
}: {
  workspaceId: string
  screenId: string
  components: SpecCatalogComponent[]
  onChanged?: () => void
}) {
  const { items, loading, error, unlink } = useScreenComponents(workspaceId, screenId)
  const [pending, setPending] = useState<{ id: string; label: string } | null>(null)
  const [unlinking, setUnlinking] = useState(false)

  return (
    <div className="space-y-2">
      {loading && items.length === 0 ? <PageSkeleton variant="list" /> : null}
      {error ? (
        <Typography tone="error" variant="small">
          {error}
        </Typography>
      ) : null}
      {items.length === 0 && !loading ? (
        <Typography variant="small" tone="muted">
          No components linked yet. Bind one from a section to copy its fields onto this screen.
        </Typography>
      ) : (
        <ul className="divide-y divide-neutral-100 border border-neutral-200">
          {items.map((link) => {
            const catalog = components.find((c) => c.id === link.componentId)
            const label = catalog
              ? `${catalog.code} · ${catalog.name}`
              : link.componentId
            return (
              <li key={`${link.componentId}-${link.sectionId ?? 'none'}`} className="flex items-center justify-between gap-2 px-3 py-2">
                <div className="min-w-0">
                  <Typography variant="small">{label}</Typography>
                  {link.sectionId ? (
                    <Typography variant="caption" tone="muted" className="block">
                      Bound to a section · copied fields stay until you unlink
                    </Typography>
                  ) : (
                    <Typography variant="caption" tone="muted" className="block">
                      Linked to this screen
                    </Typography>
                  )}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setPending({ id: link.componentId, label })}
                >
                  Unlink
                </Button>
              </li>
            )
          })}
        </ul>
      )}
      <ConfirmDialog
        open={Boolean(pending)}
        onClose={() => {
          if (!unlinking) setPending(null)
        }}
        title="Unlink component"
        message={
          pending
            ? `Unlink "${pending.label}"? Fields copied from this component (including validations and mode config) will be deleted.`
            : ''
        }
        confirmLabel="Unlink"
        variant="danger"
        loading={unlinking}
        onConfirm={async () => {
          if (!pending) return
          setUnlinking(true)
          try {
            await unlink(pending.id)
            onChanged?.()
            setPending(null)
          } finally {
            setUnlinking(false)
          }
        }}
      />
    </div>
  )
}
