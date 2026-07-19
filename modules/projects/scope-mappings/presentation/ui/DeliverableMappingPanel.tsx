'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useDeliverableMappings } from '../hooks/useDeliverableMappings'

interface DeliverableMappingPanelProps {
  deliverableId: string
}

export function DeliverableMappingPanel({ deliverableId }: DeliverableMappingPanelProps) {
  const { taskMappings, loading, mapToTask, unmapFromTask } = useDeliverableMappings(deliverableId)
  const [showInput, setShowInput] = useState(false)
  const [taskId, setTaskId] = useState('')
  const [acting, setActing] = useState(false)

  const handleAdd = async () => {
    const trimmed = taskId.trim()
    if (!trimmed) return
    setActing(true)
    try {
      await mapToTask(trimmed)
      toast.success('Task linked')
      setTaskId('')
      setShowInput(false)
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActing(false)
    }
  }

  const handleRemove = async (mappingId: string) => {
    setActing(true)
    try {
      await unmapFromTask(mappingId)
      toast.success('Task unlinked')
    } catch (err) {
      toast.error(getProblemToastMessage(err))
    } finally {
      setActing(false)
    }
  }

  return (
    <div className="space-y-3">
      <Stack direction="horizontal" spacing="sm" className="items-center justify-between">
        <Typography variant="small" tone="muted">
          Linked tasks
        </Typography>
        <Button
          size="sm"
          variant="ghost"
          icon={<Plus size={14} />}
          onClick={() => setShowInput((v) => !v)}
        >
          Add
        </Button>
      </Stack>

      {showInput ? (
        <Stack direction="horizontal" spacing="sm" className="items-center">
          <input
            type="text"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            placeholder="Task ID"
            className="flex-1 rounded border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd()
              if (e.key === 'Escape') {
                setShowInput(false)
                setTaskId('')
              }
            }}
            autoFocus
          />
          <Button size="sm" variant="primary" disabled={acting || !taskId.trim()} onClick={() => void handleAdd()}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowInput(false)
              setTaskId('')
            }}
          >
            Cancel
          </Button>
        </Stack>
      ) : null}

      {loading ? (
        <Typography variant="small" tone="muted">
          Loading…
        </Typography>
      ) : taskMappings.length === 0 ? (
        <Typography variant="small" tone="muted">
          No tasks linked
        </Typography>
      ) : (
        <ul className="space-y-1">
          {taskMappings.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded border border-neutral-200 px-3 py-2"
            >
              <Typography variant="small" className="font-mono">
                {m.taskId}
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                aria-label="Remove task mapping"
                disabled={acting}
                icon={<Trash2 size={14} />}
                onClick={() => void handleRemove(m.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
