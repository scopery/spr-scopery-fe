'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button, DetailDrawer, Input, Stack, Typography } from '@/shared/ui'
import { listTasks } from '@/modules/projects/task/infrastructure/api/tasks.api'
import { listRaidItems } from '@/modules/projects/raid/infrastructure/api/raid.api'
import { listDecisions } from '@/modules/projects/decisions/infrastructure/api/decisions.api'
import { listProjectDocuments } from '@/modules/documents/document-hub/api/document-workbench.api'
import type { CreateArtifactLinkPayload } from '../../domain/model/artifact-link'

type LinkTab = 'TASK' | 'DOCUMENT' | 'DECISION' | 'RAID_ITEM'

interface PickerItem {
  artifactType: LinkTab
  artifactId: string
  title: string
  subtitle?: string
}

interface LinkProjectItemDrawerProps {
  open: boolean
  onClose: () => void
  projectId: string
  onLink: (body: CreateArtifactLinkPayload) => Promise<unknown>
}

const TABS: { id: LinkTab; label: string }[] = [
  { id: 'TASK', label: 'Tasks' },
  { id: 'DOCUMENT', label: 'Documents' },
  { id: 'DECISION', label: 'Decisions' },
  { id: 'RAID_ITEM', label: 'RAID' },
]

export function LinkProjectItemDrawer({
  open,
  onClose,
  projectId,
  onLink,
}: LinkProjectItemDrawerProps) {
  const [tab, setTab] = useState<LinkTab>('TASK')
  const [q, setQ] = useState('')
  const [items, setItems] = useState<PickerItem[]>([])
  const [loading, setLoading] = useState(false)
  const [linkingId, setLinkingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!open || !projectId) return
    setLoading(true)
    setError(null)
    try {
      let next: PickerItem[] = []
      if (tab === 'TASK') {
        const res = await listTasks(projectId, { size: 100 })
        next = (res.items ?? []).map((t) => ({
          artifactType: 'TASK' as const,
          artifactId: t.id,
          title: t.title,
          subtitle: t.code,
        }))
      } else if (tab === 'DOCUMENT') {
        const res = await listProjectDocuments(projectId)
        next = (res.items ?? []).map((d) => ({
          artifactType: 'DOCUMENT' as const,
          artifactId: d.id,
          title: d.title ?? 'Untitled document',
          subtitle: d.code,
        }))
      } else if (tab === 'DECISION') {
        const res = await listDecisions(projectId)
        next = (res ?? []).map((d) => ({
          artifactType: 'DECISION' as const,
          artifactId: d.id,
          title: d.title,
        }))
      } else {
        const res = await listRaidItems(projectId)
        next = (res ?? []).map((r) => ({
          artifactType: 'RAID_ITEM' as const,
          artifactId: r.id,
          title: r.title,
          subtitle: r.type,
        }))
      }
      setItems(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load items')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [open, projectId, tab])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!open) {
      setQ('')
      setTab('TASK')
      setError(null)
    }
  }, [open])

  const filtered = items.filter((item) => {
    if (!q.trim()) return true
    const hay = `${item.title} ${item.subtitle ?? ''}`.toLowerCase()
    return hay.includes(q.trim().toLowerCase())
  })

  const handleLink = async (item: PickerItem) => {
    setLinkingId(item.artifactId)
    try {
      await onLink({
        targetType: item.artifactType,
        targetId: item.artifactId,
        linkType: 'REFERENCE',
      })
      onClose()
    } finally {
      setLinkingId(null)
    }
  }

  return (
    <DetailDrawer
      open={open}
      onClose={onClose}
      title="Link existing item"
      subtitle="Search project work to attach as meeting context"
      size="md"
    >
      <div className="space-y-4 p-5">
        <Stack direction="horizontal" spacing="sm" className="flex-wrap">
          {TABS.map((t) => (
            <Button
              key={t.id}
              size="sm"
              variant="neutral-flat"
              className={tab === t.id ? 'bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </Button>
          ))}
        </Stack>

        <Input
          fullWidth
          placeholder="Search…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />

        {loading ? (
          <Typography variant="small" tone="muted">
            Loading…
          </Typography>
        ) : null}
        {error ? (
          <Typography variant="small" tone="error">
            {error}
          </Typography>
        ) : null}

        {!loading && filtered.length === 0 ? (
          <Typography variant="small" tone="muted">
            No items found
          </Typography>
        ) : (
          <ul className="divide-y divide-neutral-100 border border-neutral-200">
            {filtered.map((item) => (
              <li
                key={`${item.artifactType}-${item.artifactId}`}
                className="flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-neutral-50"
              >
                <div className="min-w-0">
                  <Typography variant="small" weight="medium" className="truncate">
                    {item.title}
                  </Typography>
                  {item.subtitle ? (
                    <Typography variant="small" tone="muted">
                      {item.subtitle}
                    </Typography>
                  ) : null}
                </div>
                <Button
                  size="sm"
                  variant="neutral-flat"
                  loading={linkingId === item.artifactId}
                  onClick={() => void handleLink(item)}
                >
                  Link
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DetailDrawer>
  )
}
