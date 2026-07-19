'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Badge, Button, Stack, Typography } from '@/shared/ui'
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
    case RaidActionStatus.Complete: return 'success'
    case RaidActionStatus.Cancelled: return 'error'
    case RaidActionStatus.InProgress: return 'warning'
    default: return 'neutral'
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
        <Typography variant="small" tone="muted">Loading…</Typography>
      ) : actions.length === 0 ? (
        <Typography variant="small" tone="muted">No actions yet</Typography>
      ) : (
        <div className="overflow-x-auto border border-neutral-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-neutral-50 text-neutral-500">
              <tr>
                <th className="px-3 py-2 font-medium">Title</th>
                <th className="px-3 py-2 font-medium">Owner</th>
                <th className="px-3 py-2 font-medium">Due date</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {actions.map((action) => (
                <tr key={action.id} className="border-t border-neutral-100 hover:bg-neutral-50">
                  <td className="px-3 py-2 font-medium">{action.title}</td>
                  <td className="px-3 py-2 text-neutral-500">{action.owner ?? '—'}</td>
                  <td className="px-3 py-2 text-neutral-500">
                    {action.dueDate ? new Date(action.dueDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="px-3 py-2">
                    <Badge tone={statusTone(action.status)}>
                      {raidActionStatusLabel(action.status)}
                    </Badge>
                  </td>
                  <td className="px-3 py-2">
                    <Stack direction="horizontal" spacing="sm">
                      {canCompleteRaidAction(action) && (
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={actingId === action.id}
                          onClick={() => void handleLifecycle(action.id, 'complete')}
                        >
                          Complete
                        </Button>
                      )}
                      {canCancelRaidAction(action) && (
                        <Button
                          size="sm"
                          variant="ghost"
                          tone="error"
                          disabled={actingId === action.id}
                          onClick={() => void handleLifecycle(action.id, 'cancel')}
                        >
                          Cancel
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={actingId === action.id}
                        onClick={() => void handleCreateTask(action.id)}
                      >
                        Create task
                      </Button>
                    </Stack>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
