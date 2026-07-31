'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'sonner'
import { Badge, Button, DataTable, DetailDrawer, PageSkeleton, Typography } from '@/shared/ui'
import { useReleases } from '../hooks/useReleases'
import { QualityAddBar } from './QualityAddBar'
import type { QualityCreateInput } from './quality-bulk.model'
import { mapReleaseToReadinessDetail } from '../../infrastructure/mappers/quality-compatibility.mapper'
import { canOverrideReleaseReadiness } from '../../domain/rules/quality.rules'
import * as qualityApi from '../../infrastructure/api/quality.api'
import type { ReleasePackage, ReleaseReadinessDetail } from '../../domain/model/quality'

function readinessTone(status: string): 'neutral' | 'success' | 'warning' | 'error' {
  if (status === 'READY' || status === 'RELEASED') return 'success'
  if (status === 'AT_RISK') return 'warning'
  if (status === 'BLOCKED') return 'error'
  return 'neutral'
}

export function QualityReleasesView() {
  const params = useParams<{ projectId?: string }>()
  const scopeId = params.projectId ?? null
  const { items, loading, error, actionError, create, markReady, markAsReleased, refetch } =
    useReleases(scopeId)
  const [selected, setSelected] = useState<ReleasePackage | null>(null)
  const [readiness, setReadiness] = useState<ReleaseReadinessDetail | null>(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const openRelease = useCallback(
    async (release: ReleasePackage) => {
      if (!scopeId) return
      setSelected(release)
      setLoadingDetail(true)
      try {
        const detail =
          (await qualityApi.getReleaseReadiness(scopeId, release.id)) ??
          mapReleaseToReadinessDetail(release)
        setReadiness(detail)
      } finally {
        setLoadingDetail(false)
      }
    },
    [scopeId]
  )

  useEffect(() => {
    if (!selected) setReadiness(null)
  }, [selected])

  const handleCreate = async (input: QualityCreateInput) => {
    if (input.kind !== 'RELEASE') return
    await create(input.payload)
  }

  const handleMarkReady = async () => {
    if (!selected || !readiness) return
    if (!readiness.canMarkReady && readiness.gates.some((g) => !g.passed)) {
      toast.message('Mark Ready is blocked while gates fail. Override requires BE contract.')
      return
    }
    await markReady(selected.id)
    toast.success('Release marked ready')
    await openRelease(selected)
  }

  const handleOverride = async () => {
    if (!selected || !scopeId || !readiness) return
    const gate = canOverrideReleaseReadiness({
      readinessStatus: readiness.readinessStatus,
      hasPermission: readiness.canOverride,
      reason: 'Manual override from Quality Releases',
      approverUserId: 'pending-approver',
    })
    if (!gate.ok) {
      toast.message(gate.message)
      return
    }
    const updated = await qualityApi.overrideReleaseReadiness(scopeId, selected.id, {
      readinessStatus: 'READY',
      reason: 'Manual override from Quality Releases',
      approverUserId: 'pending-approver',
    })
    if (!updated) {
      toast.message('Override readiness endpoint is not available yet.')
      return
    }
    setReadiness(updated)
    toast.success('Readiness overridden')
  }

  if (loading) return <PageSkeleton variant="list" className="p-lg" />
  if (error) return <Typography tone="error">{error}</Typography>

  return (
    <div className="px-3 py-3 lg:px-4 lg:py-3">
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3 border-b border-neutral-200 pb-2">
        <div>
          <Typography as="h1" size="md" weight="medium">
            Releases
          </Typography>
          <Typography tone="muted" variant="caption">
            Computed readiness and gate status. AT_RISK / BLOCKED / READY come from server
            evaluation when available.
          </Typography>
        </div>
        <QualityAddBar
          kind="RELEASE"
          onCreate={handleCreate}
          onBatchComplete={async () => {
            await refetch()
            toast.success('Release(s) created')
          }}
        />
      </header>

      {actionError ? <Typography tone="error">{actionError}</Typography> : null}

      <DataTable
        className="border border-neutral-200"
        ariaLabel="Releases"
        rows={items}
        rowKey={(item) => item.id}
        emptyMessage="No releases yet."
        onRowClick={(item) => void openRelease(item)}
        columns={[
          { id: 'code', header: 'Code', accessor: (item) => item.code ?? '—', kind: 'code' },
          { id: 'name', header: 'Name', accessor: 'name' },
          { id: 'version', header: 'Version', accessor: (item) => item.versionLabel ?? '—' },
          { id: 'status', header: 'Status', accessor: 'status' },
          {
            id: 'readiness',
            header: 'Readiness',
            cell: (item) => {
              const status = mapReleaseToReadinessDetail(item).readinessStatus
              return (
                <Badge size="sm" tone={readinessTone(status)}>
                  {status}
                </Badge>
              )
            },
          },
        ]}
      />

      {selected ? (
        <DetailDrawer
          open
          onClose={() => setSelected(null)}
          title={selected.name}
          subtitle={selected.code}
        >
          <div className="space-y-3 p-4">
            {loadingDetail ? (
              <Typography tone="muted">Loading readiness…</Typography>
            ) : readiness ? (
              <>
                <Badge size="sm" tone={readinessTone(readiness.readinessStatus)}>
                  {readiness.readinessStatus}
                </Badge>
                <Typography weight="medium">Gates</Typography>
                {readiness.gates.length === 0 ? (
                  <Typography variant="caption" tone="muted">
                    Gate details unavailable until readiness API ships. Compat view maps release
                    status only.
                  </Typography>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {readiness.gates.map((gate) => (
                      <li key={gate.gateKey} className="flex items-center justify-between">
                        <span>{gate.label}</span>
                        <Badge size="sm" tone={gate.passed ? 'success' : 'error'}>
                          {gate.passed ? 'Pass' : 'Fail'}
                        </Badge>
                      </li>
                    ))}
                  </ul>
                )}
                <Typography weight="medium">Decision history</Typography>
                {readiness.decisionHistory.length === 0 ? (
                  <Typography variant="caption" tone="muted">
                    No decision history yet.
                  </Typography>
                ) : (
                  <ul className="space-y-1 text-sm">
                    {readiness.decisionHistory.map((item) => (
                      <li key={item.id}>
                        {item.action} → {item.readinessStatus} · {item.createdAt}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => void handleMarkReady()}>
                    Mark Ready
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => void markAsReleased(selected.id)}
                  >
                    Mark Released
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => void handleOverride()}>
                    Override
                  </Button>
                </div>
              </>
            ) : null}
          </div>
        </DetailDrawer>
      ) : null}
    </div>
  )
}
