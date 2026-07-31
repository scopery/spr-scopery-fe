'use client'

import { useState } from 'react'
import {
  Badge,
  Button,
  Input,
  Modal,
  PageSkeleton,
  Select,
  Stack,
  Typography,
  DataTable,
} from '@/shared/ui'
import { toast } from 'sonner'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { usePhaseDefinitions } from '../hooks/usePhaseDefinitions'
import type { PhaseDefinition } from '../../domain/model/phase-definition'
import { AdminWorkspaceSearchSelect } from '@/modules/admin/workspaces'

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

  const {
    definitions: items,
    loading,
    error,
    createDefinition: create,
    activate,
    deactivate,
    archive,
  } = usePhaseDefinitions({
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
          <AdminWorkspaceSearchSelect
            optional
            label="Filter workspace"
            value={workspaceId}
            onChange={setWorkspaceId}
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
        <DataTable
          ariaLabel="Phase Definitions List"
          rows={items}
          rowKey={(d) => String(d.id)}
          emptyMessage="No items."
          columns={[
            {
              id: 'code',
              header: 'Code',
              cell: (d) => (
                <>
                  <Typography as="span" variant="small" className="font-normal">
                    {d.code}
                  </Typography>
                </>
              ),
              kind: 'code',
            },
            { id: 'name', header: 'Name', accessor: 'name' },
            { id: 'scope', header: 'Scope', accessor: 'scope' },
            {
              id: 'status',
              header: 'Status',
              cell: (d) => (
                <>
                  <Badge tone="neutral">{d.status}</Badge>
                </>
              ),
            },
            { id: 'order', header: 'Order', accessor: 'displayOrder' },
            {
              id: 'actions',
              header: 'Actions',
              cell: (d) => (
                <>
                  <Stack direction="horizontal" spacing="sm">
                    {d.status !== 'ACTIVE' ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void activate(d.id).catch((e) => toast.error(getProblemToastMessage(e)))
                        }
                      >
                        Activate
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() =>
                          void deactivate(d.id).catch((e) => toast.error(getProblemToastMessage(e)))
                        }
                      >
                        Deactivate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        void archive(d.id).catch((e: unknown) =>
                          toast.error(getProblemToastMessage(e))
                        )
                      }
                    >
                      Archive
                    </Button>
                  </Stack>
                </>
              ),
            },
          ]}
        />
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
          <AdminWorkspaceSearchSelect value={createWorkspaceId} onChange={setCreateWorkspaceId} />
          <Input label="Code" fullWidth value={code} onChange={(e) => setCode(e.target.value)} />
          <Input label="Name" fullWidth value={name} onChange={(e) => setName(e.target.value)} />
        </div>
      </Modal>
    </div>
  )
}
