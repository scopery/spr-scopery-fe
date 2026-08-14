'use client'

import { useEffect, useMemo, useState } from 'react'
import { Archive, Plus, Trash2 } from 'lucide-react'
import { Badge, Button, DetailDrawer, Input, Select, Stack, Textarea, Typography } from '@/shared/ui'
import { WBS_NODE_TYPE_OPTIONS } from '../../domain/enums/wbs.enum'
import type { UpdateWbsNodePayload, WbsTreeNode } from '../../domain/model/wbs'
import {
  canArchiveWbsNode,
  canDeleteWbsNode,
  wbsNodeStatusLabel,
} from '../../domain/rules/wbs.rules'
import { WbsNodeTypeBadge } from './WbsNodeTypeBadge'

function toDateInput(iso: string | null | undefined): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

interface WbsNodeDetailDrawerProps {
  node: WbsTreeNode | null
  open: boolean
  acting?: boolean
  phaseLabel: string | null
  onClose: () => void
  onSave: (id: string, body: UpdateWbsNodePayload) => Promise<void>
  onArchive?: (id: string) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

export function WbsNodeDetailDrawer({
  node,
  open,
  acting,
  phaseLabel,
  onClose,
  onSave,
  onArchive,
  onDelete,
}: WbsNodeDetailDrawerProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [nodeType, setNodeType] = useState('')
  const [plannedStartDate, setPlannedStartDate] = useState('')
  const [plannedEndDate, setPlannedEndDate] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!node) return
    setTitle(node.title)
    setDescription(node.description ?? '')
    setNodeType(node.nodeType)
    setPlannedStartDate(toDateInput(node.plannedStartDate))
    setPlannedEndDate(toDateInput(node.plannedEndDate))
  }, [node])

  const canSave = Boolean(title.trim() && nodeType)
  const showArchive = node ? canArchiveWbsNode(node) : false
  const showDelete = node ? canDeleteWbsNode(node) : false

  const handleSave = async () => {
    if (!node || !canSave) return
    setSaving(true)
    try {
      await onSave(node.id, {
        title: title.trim(),
        description: description.trim() || null,
        nodeType,
        plannedStartDate: plannedStartDate || null,
        plannedEndDate: plannedEndDate || null,
      })
    } finally {
      setSaving(false)
    }
  }

  const typeOptions = useMemo(() => [...WBS_NODE_TYPE_OPTIONS], [])

  return (
    <DetailDrawer
      open={open && !!node}
      onClose={onClose}
      subtitle={node?.code}
      title={node?.title}
      ariaLabel="Planning element detail"
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {showArchive && onArchive ? (
              <Button
                size="sm"
                variant="ghost"
                tone="error"
                iconOnly
                icon={<Archive size={16} />}
                aria-label="Archive"
                title="Archive"
                disabled={acting || saving}
                onClick={() => node && void onArchive(node.id)}
              />
            ) : null}
            {showDelete && onDelete ? (
              <Button
                size="sm"
                variant="ghost"
                tone="error"
                iconOnly
                icon={<Trash2 size={16} />}
                aria-label="Delete"
                title="Delete"
                disabled={acting || saving}
                onClick={() => node && void onDelete(node.id)}
              />
            ) : null}
          </div>
          <Button
            size="sm"
            disabled={!canSave || saving || acting}
            loading={saving}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
        </div>
      }
    >
      {node ? (
        <Stack direction="vertical" spacing="md">
          <Stack direction="horizontal" spacing="sm" className="items-center">
            <WbsNodeTypeBadge nodeType={node.nodeType} />
            <Badge tone={node.status === 'ARCHIVED' ? 'neutral' : 'success'}>
              {wbsNodeStatusLabel(node.status)}
            </Badge>
          </Stack>

          <div>
            <Typography variant="small" className="mb-1.5">
              Phase
            </Typography>
            <Typography size="sm">{phaseLabel ?? 'No phase'}</Typography>
            {!node.projectPhaseId ? (
              <Typography variant="caption" tone="muted" className="mt-1">
                Phase is set when the element is created and cannot be changed later. Recreate
                the element under a phase if you need to assign one.
              </Typography>
            ) : null}
          </div>

          <Input
            label="Title"
            required
            fullWidth
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            label="Description"
            fullWidth
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <div>
            <Typography variant="small" className="mb-1.5">
              Element type
            </Typography>
            <Select value={nodeType} onValueChange={setNodeType} options={typeOptions} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Planned start"
              type="date"
              fullWidth
              value={plannedStartDate}
              onChange={(e) => setPlannedStartDate(e.target.value)}
            />
            <Input
              label="Planned end"
              type="date"
              fullWidth
              value={plannedEndDate}
              onChange={(e) => setPlannedEndDate(e.target.value)}
            />
          </div>
        </Stack>
      ) : null}
    </DetailDrawer>
  )
}
