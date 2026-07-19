'use client'

import {
  useCallback,
  useState
} from 'react'
import {
  Button,
  Input,
  PageSkeleton,
  Stack,
  Typography
} from '@/shared/ui'

import * as api from '../../infrastructure/api/event-definitions.api'
import { useEventDefinitions } from '../hooks/useEventDefinitions'

/**
 * Event Registry — catalog of event definitions (Wave 4 §3).
 * Admin platform surface for activate / deactivate / deprecate.
 */
export function EventRegistryView() {
  const [keyword, setKeyword] = useState('')
  const { items, loading, error, refetch } = useEventDefinitions({
    keyword: keyword.trim() || undefined,
    size: 50,
  })
  const [actionError, setActionError] = useState<string | null>(null)

  const activate = useCallback(
    async (id: string) => {
      setActionError(null)
      try {
        await api.activateEventDefinition(id)
        await refetch()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Activate failed')
      }
    },
    [refetch]
  )

  const deactivate = useCallback(
    async (id: string) => {
      setActionError(null)
      try {
        await api.deactivateEventDefinition(id)
        await refetch()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Deactivate failed')
      }
    },
    [refetch]
  )

  const deprecate = useCallback(
    async (id: string) => {
      setActionError(null)
      try {
        await api.deprecateEventDefinition(id, { reason: 'Deprecated from Event Registry' })
        await refetch()
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Deprecate failed')
      }
    },
    [refetch]
  )

  if (loading && items.length === 0) return <PageSkeleton variant="list" className="p-lg" />

  return (
    <Stack direction="vertical" spacing="md" className="p-lg">
      <Typography variant="h2">Event Registry</Typography>
      <Typography tone="muted">
        Platform event definitions — activate, deactivate, or deprecate catalog entries.
      </Typography>
      {error ? <Typography tone="error">{error}</Typography> : null}
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      <div className="flex flex-wrap gap-sm">
        <Input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="Search by keyword…"
          aria-label="Search event definitions"
        />
        <Button size="sm" variant="outline" onClick={() => void refetch()}>
          Search
        </Button>
      </div>
      {items.length === 0 ? (
        <Typography tone="muted">No event definitions.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((ev) => (
            <li
              key={ev.id}
              className="flex flex-col gap-sm p-md sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <Typography variant="small" weight="medium">
                  {ev.name}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[ev.code, ev.eventKey, ev.status, ev.sourceSystem].filter(Boolean).join(' · ')}
                </Typography>
              </div>
              <div className="flex flex-wrap gap-xs">
                {ev.status !== 'ACTIVE' ? (
                  <Button size="sm" variant="outline" onClick={() => void activate(ev.id)}>
                    Activate
                  </Button>
                ) : null}
                {ev.status === 'ACTIVE' ? (
                  <Button size="sm" variant="ghost" onClick={() => void deactivate(ev.id)}>
                    Deactivate
                  </Button>
                ) : null}
                {ev.status !== 'DEPRECATED' ? (
                  <Button size="sm" tone="error" variant="outline" onClick={() => void deprecate(ev.id)}>
                    Deprecate
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
