'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useScopeMappings } from '../hooks/useScopeMappings'

interface ScopeMappingPanelProps {
  scopeItemId: string
}

export function ScopeMappingPanel({ scopeItemId }: ScopeMappingPanelProps) {
  const { wbsMappings, loading, mapToWbs, unmapFromWbs } = useScopeMappings(scopeItemId)
  const [showInput, setShowInput] = useState(false)
  const [wbsNodeId, setWbsNodeId] = useState('')
  const [acting, setActing] = useState(false)

  const handleAdd = async () => {
    const trimmed = wbsNodeId.trim()
    if (!trimmed) return
    setActing(true)
    try {
      await mapToWbs(trimmed)
      toast.success('WBS node linked')
      setWbsNodeId('')
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
      await unmapFromWbs(mappingId)
      toast.success('WBS node unlinked')
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
          WBS mappings
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
            value={wbsNodeId}
            onChange={(e) => setWbsNodeId(e.target.value)}
            placeholder="WBS node ID"
            className="flex-1 rounded border border-neutral-200 px-3 py-1.5 text-sm outline-none focus:border-primary"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void handleAdd()
              if (e.key === 'Escape') {
                setShowInput(false)
                setWbsNodeId('')
              }
            }}
            autoFocus
          />
          <Button size="sm" variant="primary" disabled={acting || !wbsNodeId.trim()} onClick={() => void handleAdd()}>
            Add
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowInput(false)
              setWbsNodeId('')
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
      ) : wbsMappings.length === 0 ? (
        <Typography variant="small" tone="muted">
          No WBS nodes linked
        </Typography>
      ) : (
        <ul className="space-y-1">
          {wbsMappings.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded border border-neutral-200 px-3 py-2"
            >
              <Typography variant="small" className="font-mono">
                {m.wbsNodeId}
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                aria-label="Remove WBS mapping"
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
