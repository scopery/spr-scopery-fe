'use client'

import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useQualityCenter } from '../hooks/useQualityCenter'
import { QualityAddBar } from './QualityAddBar'
import { displayName } from '../../domain/model/quality'
import type { QualityCreateInput } from './quality-bulk.model'

export function QualityCenterView() {
  const params = useParams<{ workspaceId: string; projectId?: string }>()
  const scopeId = params.projectId ?? null
  const { items, loading, error, actionError, create, approve, markCurrent, refetch } =
    useQualityCenter(scopeId)

  const handleCreate = async (input: QualityCreateInput) => {
    if (input.kind !== 'QUALITY_PLAN') return
    await create(input.payload)
  }

  if (loading) return <PageSkeleton variant="cards" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Quality Center
          </Typography>
          <Typography tone="muted" variant="caption">
            Quality plans — create single or paste bulk from Excel.
          </Typography>
        </div>
        <QualityAddBar
          kind="QUALITY_PLAN"
          onCreate={handleCreate}
          onBatchComplete={async () => {
            await refetch()
            toast.success('Quality plan(s) created')
          }}
        />
      </div>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {items.length === 0 ? (
        <Typography tone="muted">No quality plans yet. Use Add to create one.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {displayName(item)}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[item.code, item.status, item.currentFlag ? 'CURRENT' : null]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </div>
              <div className="flex gap-xs">
                <Button size="sm" variant="outline" onClick={() => void approve(item.id)}>
                  Approve
                </Button>
                <Button size="sm" variant="ghost" onClick={() => void markCurrent(item.id)}>
                  Mark current
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
