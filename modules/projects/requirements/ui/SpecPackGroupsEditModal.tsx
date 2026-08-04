'use client'

import { useEffect, useState } from 'react'
import { Modal, Typography } from '@/shared/ui'
import type { SpecPackGroup } from '../model/spec-pack'
import { SpecPackGroupOutline } from './SpecPackGroupOutline'

interface SpecPackGroupsEditModalProps {
  open: boolean
  onClose: () => void
  groups: SpecPackGroup[]
  focusGroupId?: string | null
  onSave: (groups: SpecPackGroup[]) => void
}

/**
 * Spacious editor for group names/descriptions + drag reorder (groups & requirements).
 * Sidebar stays read-only; all structural edits happen here.
 */
export function SpecPackGroupsEditModal({
  open,
  onClose,
  groups,
  focusGroupId,
  onSave,
}: SpecPackGroupsEditModalProps) {
  const [draft, setDraft] = useState<SpecPackGroup[]>(groups)

  useEffect(() => {
    if (!open) return
    setDraft(groups.map((g) => ({ ...g, requirements: [...g.requirements] })))
  }, [open, groups])

  const handleSave = () => {
    const cleaned = draft.map((g) => ({
      ...g,
      name: g.name.trim() || 'Untitled group',
      description: g.description?.trim() || null,
    }))
    if (cleaned.length === 0) return
    onSave(cleaned)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit groups & reading order"
      size="xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline' },
        { label: 'Save', onClick: handleSave },
      ]}
    >
      <div className="space-y-3">
        <Typography variant="small" tone="muted">
          Drag groups to reorder · drag requirements within or across groups · edit
          name & description with the pencil. Undo with Ctrl/⌘Z.
        </Typography>
        <div className="h-[min(60vh,520px)] overflow-hidden border border-neutral-200">
          <SpecPackGroupOutline
            key={open ? `edit-${focusGroupId ?? 'all'}` : 'closed'}
            groups={draft}
            onChange={setDraft}
            activeRequirementId={null}
            allowRemoveRequirement
            editableMeta
            enableUndo
            initiallyExpandGroupId={focusGroupId}
            className="h-full"
          />
        </div>
      </div>
    </Modal>
  )
}
