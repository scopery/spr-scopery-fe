'use client'

import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Button, PageSkeleton, Stack, Typography } from '@/shared/ui'
import { useDefects } from '../hooks/useDefects'
import { QualityAddBar } from './QualityAddBar'
import type { QualityCreateInput } from './quality-bulk.model'

export function DefectCenterView() {
  const params = useParams<{ workspaceId: string; projectId?: string }>()
  const scopeId = params.projectId ?? null
  const { items, loading, error, actionError, create, close, refetch } = useDefects(scopeId)

  const handleCreate = async (input: QualityCreateInput) => {
    if (input.kind !== 'DEFECT') return
    await create(input.payload)
  }

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <Stack direction="vertical" spacing="md" className="px-3 py-3 lg:px-4 lg:py-3">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Defect Center
          </Typography>
          <Typography tone="muted" variant="caption">
            Create defects one-by-one or bulk paste from Excel.
          </Typography>
        </div>
        <QualityAddBar
          kind="DEFECT"
          onCreate={handleCreate}
          onBatchComplete={async () => {
            await refetch()
            toast.success('Defect(s) created')
          }}
        />
      </div>
      {actionError ? <Typography tone="error">{actionError}</Typography> : null}
      {items.length === 0 ? (
        <Typography tone="muted">No defects yet.</Typography>
      ) : (
        <ul className="divide-y divide-neutral-200 border border-neutral-200">
          {items.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-md p-md">
              <div>
                <Typography variant="small" weight="medium">
                  {item.title ?? item.code ?? 'Untitled defect'}
                </Typography>
                <Typography variant="caption" tone="muted">
                  {[item.code, item.category, item.severity, item.priority, item.status]
                    .filter(Boolean)
                    .join(' · ')}
                </Typography>
              </div>
              {item.status !== 'CLOSED' ? (
                <Button size="sm" variant="outline" onClick={() => void close(item.id)}>
                  Close
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Stack>
  )
}
