'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, DataTable, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useRaidActions } from '../hooks/useRaidActions'
import { AddRaidActionModal } from './AddRaidActionModal'
import {
  canCancelRaidAction,
  canCompleteRaidAction,
  raidActionStatusLabel,
} from '../../domain/rules/raid-action.rules'
import { RaidActionStatus } from '../../domain/enums/raid-action.enum'

function statusTone(status: string): 'success' | 'error' | 'warning' | 'neutral' {
  switch (status) {
    case RaidActionStatus.Complete:
      return 'success'
    case RaidActionStatus.Cancelled:
      return 'error'
    case RaidActionStatus.InProgress:
      return 'warning'
    default:
      return 'neutral'
  }
}

interface Props {
  projectId: string
  raidItemId: string
}

export function RaidActionsPanel({ projectId, raidItemId }: Props) {
  const { actions, loading, actingId, createAction, runLifecycle, createLinkedTask } =
    useRaidActions(projectId, raidItemId)
  const [addOpen, setAddOpen] = useState(false)

  const handleLifecycle = async (actionId: string, lifecycle: 'complete' | 'cancel') => {
    try {
      await runLifecycle(actionId, lifecycle)
      toast.success(lifecycle === 'complete' ? 'Action completed' : 'Action cancelled')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  const handleCreateTask = async (actionId: string) => {
    try {
      await createLinkedTask(actionId)
      toast.success('Linked task created')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Typography variant="small" weight="medium" tone="muted">
          Actions
        </Typography>
        <Button
          size="sm"
          variant="secondary"
          icon={<Plus size={14} />}
          onClick={() => setAddOpen(true)}
        >
          Add action
        </Button>
      </div>

      {loading && actions.length === 0 ? (
        <Typography variant="small" tone="muted">
          Loading…
        </Typography>
      ) : actions.length === 0 ? (
        <Typography variant="small" tone="muted">
          No actions yet
        </Typography>
      ) : (
        <div className="border border-neutral-200 bg-white">
          <DataTable
            ariaLabel="RAID actions"
            rows={actions}
            rowKey={(action) => action.id}
            columns={[
              { id: 'title', header: 'Title', accessor: 'title' },
              { id: 'owner', header: 'Owner', accessor: (action) => action.owner ?? '—' },
              {
                id: 'dueDate',
                header: 'Due date',
                accessor: (action) =>
                  action.dueDate ? new Date(action.dueDate).toLocaleDateString() : '—',
              },
              {
                id: 'status',
                header: 'Status',
                cell: (action) => (
                  <Badge tone={statusTone(action.status)}>
                    {raidActionStatusLabel(action.status)}
                  </Badge>
                ),
              },
              {
                id: 'actions',
                header: 'Actions',
                cell: (action) => (
                  <Stack direction="horizontal" spacing="sm">
                    {canCompleteRaidAction(action) ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        disabled={actingId === action.id}
                        onClick={() => void handleLifecycle(action.id, 'complete')}
                      >
                        Complete
                      </Button>
                    ) : null}
                    {canCancelRaidAction(action) ? (
                      <Button
                        size="sm"
                        variant="ghost"
                        tone="error"
                        disabled={actingId === action.id}
                        onClick={() => void handleLifecycle(action.id, 'cancel')}
                      >
                        Cancel
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={actingId === action.id}
                      onClick={() => void handleCreateTask(action.id)}
                    >
                      Create task
                    </Button>
                  </Stack>
                ),
              },
            ]}
          />
        </div>
      )}

      <AddRaidActionModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={async (body) => {
          await createAction(body)
          toast.success('Action added')
        }}
      />
    </div>
  )
}
