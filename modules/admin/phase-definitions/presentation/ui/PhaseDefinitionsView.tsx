'use client'

import { useState } from 'react'
import { Badge, Button, PageSkeleton, Select, Stack, Typography, DataTable } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { cn } from '@/utils/cn'
import {
  canActivatePhaseDefinition,
  canArchivePhaseDefinition,
  canDeactivatePhaseDefinition,
  phaseDefinitionStatusLabel,
  phaseDefinitionStatusTone,
} from '../../domain/rules/phase-definition.rules'
import { PhaseDefinitionScope } from '../../domain/enums/phase-definition.enum'
import { usePhaseDefinitions } from '../hooks/usePhaseDefinitions'
import { CreatePhaseDefinitionModal } from './CreatePhaseDefinitionModal'
import type { CreatePhaseDefinitionPayload } from '../../domain/model/phase-definition'

const SCOPE_FILTER_OPTIONS = [
  { value: '', label: 'All scopes' },
  { value: PhaseDefinitionScope.System, label: 'System' },
  { value: PhaseDefinitionScope.Organization, label: 'Organization' },
  { value: PhaseDefinitionScope.Workspace, label: 'Workspace' },
]

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'ARCHIVED', label: 'Archived' },
]

export function PhaseDefinitionsView() {
  const [scopeFilter, setScopeFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [createOpen, setCreateOpen] = useState(false)

  const {
    definitions,
    loading,
    error,
    forbidden,
    actingId,
    createDefinition,
    activate,
    deactivate,
    archive,
  } = usePhaseDefinitions({
    scope: scopeFilter || undefined,
    status: statusFilter || undefined,
  })

  async function handleCreate(
    scope: string,
    body: CreatePhaseDefinitionPayload & { workspaceId?: string }
  ) {
    await createDefinition(scope, body)
  }

  if (forbidden) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Typography tone="muted">You do not have permission to view phase definitions.</Typography>
      </div>
    )
  }

  if (loading && definitions.length === 0) return <PageSkeleton variant="list" />

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <Typography as="h1" size="lg" weight="semibold">
            Phase definitions
          </Typography>
          <Typography variant="small" tone="muted" className="mt-1">
            Edits do not cascade to existing project phases.
          </Typography>
        </div>
        <Button variant="primary" onClick={() => setCreateOpen(true)}>
          New definition
        </Button>
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-4 flex-wrap">
        <Select
          value={scopeFilter}
          onValueChange={setScopeFilter}
          options={SCOPE_FILTER_OPTIONS}
          className="w-44"
        />
        <Select
          value={statusFilter}
          onValueChange={setStatusFilter}
          options={STATUS_FILTER_OPTIONS}
          className="w-44"
        />
      </Stack>

      {error ? (
        <div className="mb-4 border border-red-200 bg-red-50 p-3">
          <Typography variant="small" className="text-red-700">
            {error}
          </Typography>
        </div>
      ) : null}

      <div className="overflow-x-auto border border-neutral-200 bg-white">
        <DataTable
          ariaLabel="Phase Definitions"
          rows={definitions}
          rowKey={(def) => String(def.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'code',
              header: 'Code',
              cell: (def) => {
                const isActing = actingId === def.id
                return (
                  <>
                    <Typography as="span" variant="small" className="font-normal">
                      {def.code}
                    </Typography>
                  </>
                )
              },
              kind: 'code',
            },
            { id: 'name', header: 'Name', accessor: 'name' },
            {
              id: 'scope',
              header: 'Scope',
              cell: (def) => {
                const isActing = actingId === def.id
                return <>{def.scope.toLowerCase()}</>
              },
              cellClassName: 'capitalize',
            },
            { id: 'order', header: 'Order', accessor: 'displayOrder' },
            {
              id: 'default',
              header: 'Default',
              cell: (def) => {
                const isActing = actingId === def.id
                return <>{def.isSystemDefault ? 'Yes' : '—'}</>
              },
            },
            {
              id: 'status',
              header: 'Status',
              cell: (def) => {
                const isActing = actingId === def.id
                return (
                  <>
                    <Badge tone={phaseDefinitionStatusTone(def.status)}>
                      {phaseDefinitionStatusLabel(def.status)}
                    </Badge>
                  </>
                )
              },
            },
            {
              id: 'actions',
              header: 'Actions',
              cell: (def) => {
                const isActing = actingId === def.id
                return (
                  <>
                    <Stack direction="horizontal" spacing="sm">
                      {canActivatePhaseDefinition(def) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isActing}
                          onClick={() =>
                            void activate(def.id).catch((e) =>
                              toast.error(getProblemToastMessage(e))
                            )
                          }
                        >
                          Activate
                        </Button>
                      )}
                      {canDeactivatePhaseDefinition(def) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isActing}
                          onClick={() =>
                            void deactivate(def.id).catch((e) =>
                              toast.error(getProblemToastMessage(e))
                            )
                          }
                        >
                          Deactivate
                        </Button>
                      )}
                      {canArchivePhaseDefinition(def) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          disabled={isActing}
                          onClick={() =>
                            void archive(def.id).catch((e) =>
                              toast.error(getProblemToastMessage(e))
                            )
                          }
                        >
                          Archive
                        </Button>
                      )}
                    </Stack>
                  </>
                )
              },
            },
          ]}
        />
      </div>

      <CreatePhaseDefinitionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
