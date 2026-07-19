'use client'

import { useState } from 'react'
import { Badge, Button, Input, Modal, PageSkeleton, Select, Stack, Typography } from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { usePhaseDefinitions } from '../hooks/usePhaseDefinitions'
import type { PhaseDefinition } from '../../domain/model/phase-definition'

const SCOPE_OPTIONS = [
  { value: '', label: 'All scopes' },
  { value: 'SYSTEM', label: 'System' },
  { value: 'ORGANIZATION', label: 'Organization' },
  { value: 'WORKSPACE', label: 'Workspace' },
]

export function PhaseDefinitionsListView() {
  const [scope, setScope] = useState('')
  const [workspaceId, setWorkspaceId] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [createWorkspaceId, setCreateWorkspaceId] = useState('')
  const [creating, setCreating] = useState(false)

  const { definitions: items, loading, error, createDefinition: create, activate, deactivate, archive } = usePhaseDefinitions({
    scope: scope || undefined,
    workspaceId: workspaceId.trim() || undefined,
  })

  if (loading && items.length === 0) return <PageSkeleton variant="list" />

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
          New workspace phase
        </Button>
      </div>

      <Stack direction="horizontal" spacing="sm" className="mb-4 flex-wrap">
        <Select value={scope} onValueChange={setScope} options={SCOPE_OPTIONS} className="w-44" />
        <div className="w-64">
          <Input
            fullWidth
            placeholder="Filter workspace ID…"
            value={workspaceId}
            onChange={(e) => setWorkspaceId(e.target.value)}
          />
        </div>
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
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <Typography variant="small" tone="muted">
                    No phase definitions
                  </Typography>
                </td>
              </tr>
            ) : (
              items.map((d: PhaseDefinition) => (
                <tr key={d.id} className="border-t border-neutral-100">
                  <td className="px-4 py-3">
                    <Typography as="span" variant="small" className="font-mono">
                      {d.code}
                    </Typography>
                  </td>
                  <td className="px-4 py-3">{d.name}</td>
                  <td className="px-4 py-3">{d.scope}</td>
                  <td className="px-4 py-3">
                    <Badge tone="neutral">{d.status}</Badge>
                  </td>
                  <td className="px-4 py-3">{d.displayOrder}</td>
                  <td className="px-4 py-3">
                    <Stack direction="horizontal" spacing="sm">
                      {d.status !== 'ACTIVE' ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void activate(d.id).catch((e) =>
                              toast.error(getProblemToastMessage(e))
                            )
                          }
                        >
                          Activate
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            void deactivate(d.id).catch((e) =>
                              toast.error(getProblemToastMessage(e))
                            )
                          }
                        >
                          Deactivate
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void archive(d.id).catch((e: unknown) => toast.error(getProblemToastMessage(e)))
                        }
                      >
                        Archive
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create workspace phase definition"
        size="sm"
        actions={[
          { label: 'Cancel', onClick: () => setCreateOpen(false), variant: 'ghost' },
          {
            label: 'Create',
            loading: creating,
            variant: 'primary',
            onClick: () => {
              if (!createWorkspaceId.trim() || !code.trim() || !name.trim()) return
              setCreating(true)
              void create(createWorkspaceId.trim(), {
                code: code.trim().toUpperCase(),
                name: name.trim(),
              })
                .then(() => {
                  toast.success('Created')
                  setCreateOpen(false)
                  setCode('')
                  setName('')
                })
                .catch((e: unknown) => toast.error(getProblemToastMessage(e)))
                .finally(() => setCreating(false))
            },
          },
        ]}
      >
        <div className="space-y-3">
          <Input
            label="Workspace ID"
            fullWidth
            value={createWorkspaceId}
            onChange={(e) => setCreateWorkspaceId(e.target.value)}
          />
          <Input label="Code" fullWidth value={code} onChange={(e) => setCode(e.target.value)} />
          <Input label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
