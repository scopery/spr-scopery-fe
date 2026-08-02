'use client'

import { useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button, Stack, Typography } from '@/shared/ui'
import { getProblemToastMessage } from '@/shared/lib/errorHandling'
import { useScopeMappings } from '../hooks/useScopeMappings'
import {
  WbsNodeSearchSelect,
  useProjectWbs,
  type WbsTreeNode,
} from '@/modules/projects/wbs'

interface ScopeMappingPanelProps {
  scopeItemId: string
  projectId: string
}

function collectWbsLabels(nodes: WbsTreeNode[], labels = new Map<string, string>()) {
  for (const node of nodes) {
    labels.set(node.id, `${node.code} · ${node.title}`)
    collectWbsLabels(node.children, labels)
  }
  return labels
}

export function ScopeMappingPanel({ scopeItemId, projectId }: ScopeMappingPanelProps) {
  const { wbsMappings, loading, mapToWbs, unmapFromWbs } = useScopeMappings(scopeItemId)
  const { tree } = useProjectWbs(projectId || null)
  const wbsLabels = useMemo(() => collectWbsLabels(tree), [tree])
  const [showInput, setShowInput] = useState(false)
  const [wbsNodeId, setWbsNodeId] = useState('')
  const [acting, setActing] = useState(false)

  const handleAdd = async () => {
    const trimmed = wbsNodeId.trim()
    if (!trimmed) return
    setActing(true)
    try {
      await mapToWbs(trimmed)
      toast.success('Planning element linked')
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
      toast.success('Planning element unlinked')
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
          Planning element mappings
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
        <div className="flex items-center gap-sm">
          <div className="flex-1">
            <WbsNodeSearchSelect projectId={projectId} value={wbsNodeId} onChange={setWbsNodeId} />
          </div>
          <Button
            size="sm"
            variant="primary"
            disabled={acting || !wbsNodeId.trim()}
            onClick={() => void handleAdd()}
          >
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
        </div>
      ) : null}

      {loading ? (
        <Typography variant="small" tone="muted">
          Loading…
        </Typography>
      ) : wbsMappings.length === 0 ? (
        <Typography variant="small" tone="muted">
          No planning elements linked
        </Typography>
      ) : (
        <ul className="space-y-1">
          {wbsMappings.map((m) => (
            <li
              key={m.id}
              className="flex items-center justify-between gap-2 rounded border border-neutral-200 px-3 py-2"
            >
              <Typography variant="small">
                {wbsLabels.get(m.wbsNodeId) ?? 'Unavailable planning element'}
              </Typography>
              <Button
                size="sm"
                variant="ghost"
                iconOnly
                aria-label="Remove planning element mapping"
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
