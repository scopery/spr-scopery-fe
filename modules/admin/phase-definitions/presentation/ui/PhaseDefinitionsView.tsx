'use client'

import { useState } from 'react'
import { Badge, Button, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
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

  const { definitions, loading, error, forbidden, actingId, createDefinition, activate, deactivate, archive } =
    usePhaseDefinitions({
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
        <table className="min-w-full text-left text-sm">
          <thead className="bg-neutral-50 text-neutral-600">
            <tr>
              <th className="px-4 py-3 font-medium">Code</th>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Scope</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Default</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {definitions.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No phase definitions found.
                  </Typography>
                </td>
              </tr>
            ) : (
              definitions.map((def) => {
                const isActing = actingId === def.id
                return (
                  <tr
                    key={def.id}
                    className={cn('border-t border-neutral-100', isActing && 'opacity-60')}
                  >
                    <td className="px-4 py-3">
                      <Typography as="span" variant="small" className="font-mono">
                        {def.code}
                      </Typography>
                    </td>
                    <td className="px-4 py-3">{def.name}</td>
                    <td className="px-4 py-3 capitalize">{def.scope.toLowerCase()}</td>
                    <td className="px-4 py-3">{def.displayOrder}</td>
                    <td className="px-4 py-3">{def.isSystemDefault ? 'Yes' : '—'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={phaseDefinitionStatusTone(def.status)}>
                        {phaseDefinitionStatusLabel(def.status)}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
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
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      <CreatePhaseDefinitionModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreate}
      />
    </div>
  )
}
