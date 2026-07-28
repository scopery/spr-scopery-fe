'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Badge, Button, PageSkeleton, Typography } from '@/shared/ui'
import { useResolveUsers } from '@/modules/platform/identity/presentation/hooks/useResolveUsers'
import { useWorkspaceActivityFeed } from '../../workspace/hooks/useWorkspaceActivityFeed'
import type { WorkspaceActivityFeedItem } from '../../workspace/model/workspace-activity'
import { listOrganizationActivityFeed } from '../api/organization-activity.api'
import { ApiError } from '@/shared/lib/api-types'
import { cn } from '@/utils/cn'

function formatEventType(eventType: string): string {
  return eventType
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function ActivityRows({
  items,
  labelFor,
}: {
  items: WorkspaceActivityFeedItem[]
  labelFor: (id: string) => string
}) {
  if (items.length === 0) {
    return (
      <div className="border border-dashed border-neutral-300 bg-white px-4 py-10 text-center">
        <Typography variant="small" tone="muted">
          No activity recorded yet for this scope.
        </Typography>
      </div>
    )
  }

  return (
    <ul className="divide-y divide-neutral-100 border border-neutral-200 bg-white">
      {items.map((item) => (
        <li key={item.id} className="px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <Typography variant="small" weight="medium" className="text-neutral-900">
                  {formatEventType(item.eventType)}
                </Typography>
                {item.severity ? (
                  <Badge
                    variant="soft"
                    size="sm"
                    tone={
                      item.severity === 'CRITICAL' || item.severity === 'ERROR'
                        ? 'error'
                        : item.severity === 'WARN'
                          ? 'warning'
                          : 'neutral'
                    }
                  >
                    {item.severity}
                  </Badge>
                ) : null}
              </div>
              {item.reason ? (
                <Typography variant="small" tone="muted" className="mt-0.5 leading-relaxed">
                  {item.reason}
                </Typography>
              ) : null}
              <Typography variant="small" tone="muted" className="mt-1 text-xs">
                {item.actorId ? labelFor(item.actorId) : item.actorType || 'System'}
                {item.resourceType ? ` · ${formatEventType(item.resourceType)}` : ''}
              </Typography>
            </div>
            <Typography variant="small" tone="muted" className="shrink-0 text-xs">
              {formatWhen(item.occurredAt)}
            </Typography>
          </div>
        </li>
      ))}
    </ul>
  )
}

function useOrganizationActivityFeed(organizationId: string | null, page = 0, size = 30) {
  const [items, setItems] = useState<WorkspaceActivityFeedItem[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const load = useCallback(async () => {
    if (!organizationId) {
      setItems([])
      return
    }
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await listOrganizationActivityFeed(organizationId, { page, size })
      setItems(res.items ?? [])
      setTotalPages(res.totalPages ?? 0)
    } catch (err) {
      setItems([])
      setTotalPages(0)
      if (err instanceof ApiError && err.status === 403) {
        setForbidden(true)
        setError('You do not have permission to view organization activity.')
      } else {
        setError(err instanceof Error ? err.message : 'Failed to load activity')
      }
    } finally {
      setLoading(false)
    }
  }, [organizationId, page, size])

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalPages, loading, error, forbidden, refetch: load }
}

export function OrganizationActivityPanel({
  scopeLabel,
  workspaceId,
  organizationId,
}: {
  scopeLabel: string
  workspaceId?: string
  organizationId?: string
}) {
  const [page, setPage] = useState(0)
  const isWorkspace = Boolean(workspaceId)
  const workspaceFeed = useWorkspaceActivityFeed(workspaceId ?? null, page, 30)
  const orgFeed = useOrganizationActivityFeed(organizationId ?? null, page, 30)

  const feed = isWorkspace ? workspaceFeed : orgFeed
  const actorIds = useMemo(
    () =>
      feed.items
        .map((i) => i.actorId)
        .filter((id): id is string => Boolean(id)),
    [feed.items]
  )
  const { labelFor } = useResolveUsers(actorIds)

  return (
    <div>
      <div className="mb-4">
        <Typography as="h2" size="md" weight="semibold">
          Activity
        </Typography>
        <Typography variant="small" tone="muted" className="mt-1">
          Security and lifecycle events for this {scopeLabel}. Visible to managers only.
        </Typography>
      </div>

      {feed.loading && feed.items.length === 0 ? (
        <PageSkeleton variant="list" />
      ) : feed.forbidden ? (
        <div className="border border-neutral-200 bg-neutral-50 p-4">
          <Typography variant="small" tone="muted">
            {feed.error}
          </Typography>
        </div>
      ) : feed.error ? (
        <Typography variant="small" tone="error">
          {feed.error}
        </Typography>
      ) : (
        <>
          <ActivityRows items={feed.items} labelFor={labelFor} />
          {feed.totalPages > 1 ? (
            <div className={cn('mt-3 flex items-center justify-end gap-2')}>
              <Button
                size="sm"
                variant="ghost"
                className="bg-neutral-100"
                disabled={page <= 0}
                onClick={() => setPage((p) => Math.max(0, p - 1))}
              >
                Previous
              </Button>
              <Typography variant="small" tone="muted">
                Page {page + 1} of {feed.totalPages}
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                className="bg-neutral-100"
                disabled={page + 1 >= feed.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}
