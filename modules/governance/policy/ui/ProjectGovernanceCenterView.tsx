'use client'

import { useParams } from 'next/navigation'
import {
  Button,
  GovernedObjectBadge,
  LifecycleStepState,
  LifecycleTimeline,
  PageSkeleton,
  Stack,
  Typography,
} from '@/shared/ui'
import { useProjectGovernance } from '../hooks/useProjectGovernance'

export function ProjectGovernanceCenterView() {
  const { projectId } = useParams<{ projectId: string }>()
  const {
    ownership,
    locks,
    pack,
    objectTypes,
    baselineCheck,
    selected,
    grants,
    versions,
    loading,
    error,
    actionError,
    selectObject,
    releaseSelectedLock,
    finalizeSelected,
    revokeGrant,
    runBaselineGuard,
  } = useProjectGovernance(projectId)

  if (loading) return <PageSkeleton variant="list" />
  if (error) return <Typography tone="error">{error}</Typography>

  const selectedLock = selected
    ? locks.find(
        (l) => l.objectTypeCode === selected.objectTypeCode && l.targetId === selected.targetId
      )
    : undefined
  const selectedOwner = selected
    ? ownership.find(
        (o) => o.objectTypeCode === selected.objectTypeCode && o.targetId === selected.targetId
      )
    : undefined
  const objectTypeLabel = (code: string) =>
    objectTypes.find((objectType) => objectType.code === code)?.name ?? code

  return (
    <div className="grid min-h-[420px] grid-cols-1 gap-md p-lg lg:grid-cols-[1fr_340px]">
      <Stack direction="vertical" spacing="md">
        <Typography as="h1" size="md" weight="medium">
          Project Governance Center
        </Typography>
        <div className="flex flex-wrap items-center gap-sm">
          <Button size="sm" variant="outline" onClick={() => void runBaselineGuard()}>
            Baseline guard check
          </Button>
          {baselineCheck ? (
            <Typography variant="caption" tone="muted">
              {baselineCheck.allowed ? 'Allowed' : 'Blocked'}
              {baselineCheck.reason ? ` · ${baselineCheck.reason}` : ''}
            </Typography>
          ) : null}
          <Typography variant="caption" tone="muted">
            Object types: {objectTypes.length}
          </Typography>
        </div>
        <LifecycleTimeline
          aria-label="Governance lifecycle"
          steps={[
            {
              id: 'own',
              label: 'Ownership',
              state:
                (pack?.ownershipCount ?? ownership.length) > 0
                  ? LifecycleStepState.Completed
                  : LifecycleStepState.Current,
            },
            {
              id: 'lock',
              label: 'Locks',
              state:
                (pack?.lockCount ?? locks.length) > 0
                  ? LifecycleStepState.Current
                  : LifecycleStepState.Upcoming,
            },
            {
              id: 'final',
              label: 'Finalization',
              state: LifecycleStepState.Upcoming,
            },
            {
              id: 'snap',
              label: 'Snapshots',
              state:
                versions.length > 0 ? LifecycleStepState.Completed : LifecycleStepState.Upcoming,
            },
          ]}
        />

        <Typography variant="h4">Ownership</Typography>
        {ownership.length === 0 ? (
          <Typography tone="muted" variant="caption">
            No ownership records.
          </Typography>
        ) : (
          <ul className="divide-y divide-neutral-200 border border-neutral-200">
            {ownership.map((o) => (
              <li key={`${o.objectTypeCode}-${o.targetId}`}>
                <button
                  type="button"
                  className="flex w-full flex-col items-start p-md text-left hover:bg-neutral-50"
                  onClick={() => void selectObject(o.objectTypeCode, o.targetId)}
                >
                  <Typography variant="small" weight="medium">
                    {objectTypeLabel(o.objectTypeCode)}
                  </Typography>
                  <Typography variant="caption" tone="muted">
                    {o.ownerDisplayName ?? 'Owner unavailable'}
                  </Typography>
                </button>
              </li>
            ))}
          </ul>
        )}

        <Typography variant="h4">Locked objects</Typography>
        {locks.length === 0 ? (
          <Typography tone="muted" variant="caption">
            No locks.
          </Typography>
        ) : (
          <ul className="divide-y divide-neutral-200 border border-neutral-200">
            {locks.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-md p-md">
                <button
                  type="button"
                  className="text-left text-sm hover:underline"
                  onClick={() => void selectObject(l.objectTypeCode, l.targetId)}
                >
                  {objectTypeLabel(l.objectTypeCode)} · Locked object
                </button>
                <Button size="sm" variant="ghost" onClick={() => void releaseSelectedLock(l.id)}>
                  Release
                </Button>
              </li>
            ))}
          </ul>
        )}
      </Stack>

      <Stack direction="vertical" spacing="sm" className="border border-neutral-200 p-md">
        <Typography variant="h4">Object inspector</Typography>
        {!selected ? (
          <Typography tone="muted">Select an ownership or lock row</Typography>
        ) : (
          <>
            <GovernedObjectBadge
              locked={Boolean(selectedLock)}
              finalized={false}
              ownerLabel={selectedOwner?.ownerDisplayName ?? undefined}
            />
            <Typography variant="caption" tone="muted">
              {objectTypeLabel(selected.objectTypeCode)} · Selected object
            </Typography>
            {actionError ? <Typography tone="error">{actionError}</Typography> : null}
            <Button
              size="sm"
              variant="outline"
              onClick={() => void finalizeSelected('Finalized from governance center')}
            >
              Finalize
            </Button>

            <Typography variant="caption" weight="medium">
              Access grants
            </Typography>
            {grants.length === 0 ? (
              <Typography tone="muted" variant="caption">
                No grants
              </Typography>
            ) : (
              <ul className="text-sm">
                {grants.map((g) => (
                  <li key={g.id} className="flex justify-between gap-sm py-xs">
                    <span>{g.grantRole ?? 'Access grant'}</span>
                    <Button size="sm" variant="ghost" onClick={() => void revokeGrant(g.id)}>
                      Revoke
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <Typography variant="caption" weight="medium">
              Versions
            </Typography>
            {versions.length === 0 ? (
              <Typography tone="muted" variant="caption">
                No snapshots
              </Typography>
            ) : (
              <ul className="text-sm">
                {versions.map((v) => (
                  <li key={v.id} className="py-xs">
                    {v.label ?? (v.versionNumber != null ? `v${v.versionNumber}` : 'Snapshot')}
                    {v.createdAt ? ` · ${v.createdAt}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </Stack>
    </div>
  )
}
