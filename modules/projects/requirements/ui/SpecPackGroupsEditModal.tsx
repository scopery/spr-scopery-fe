'use client'

import { useEffect, useState } from 'react'
import { Input, Modal, Typography } from '@/shared/ui'
import type { SpecPackGroup } from '../model/spec-pack'
import { SpecPackProductName } from '../model/spec-pack.labels'
import { SpecPackGroupOutline } from './SpecPackGroupOutline'

interface SpecPackGroupsEditModalProps {
  open: boolean
  onClose: () => void
  /** Pack title — editable in the same modal. */
  title: string
  groups: SpecPackGroup[]
  focusGroupId?: string | null
  onSave: (next: { title: string; groups: SpecPackGroup[] }) => void
}

/**
 * Edit pack title + groups / reading order in a modal (not inside preview).
 */
export function SpecPackGroupsEditModal({
  open,
  onClose,
  title,
  groups,
  focusGroupId,
  onSave,
}: SpecPackGroupsEditModalProps) {
  const [draftTitle, setDraftTitle] = useState(title)
  const [draft, setDraft] = useState<SpecPackGroup[]>(groups)

  useEffect(() => {
    if (!open) return
    setDraftTitle(title)
    setDraft(groups.map((g) => ({ ...g, requirements: [...g.requirements] })))
  }, [open, title, groups])

  const handleSave = () => {
    const cleaned = draft.map((g) => ({
      ...g,
      name: g.name.trim() || 'Untitled group',
      description: g.description?.trim() || null,
    }))
    if (cleaned.length === 0) return
    onSave({
      title: draftTitle.trim() || SpecPackProductName.untitled,
      groups: cleaned,
    })
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={SpecPackProductName.editTitle}
      size="xl"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'outline' },
        { label: 'Save', onClick: handleSave },
      ]}
    >
      <div className="space-y-4">
        <div className="space-y-1.5">
          <Typography variant="small" weight="medium">
            Title
          </Typography>
          <Input
            value={draftTitle}
            onChange={(e) => setDraftTitle(e.target.value)}
            fullWidth
            aria-label={SpecPackProductName.titleFieldAria}
            placeholder={SpecPackProductName.titlePlaceholder}
          />
        </div>
        <div className="space-y-2">
          <Typography variant="small" weight="medium">
            Groups & reading order
          </Typography>
          <Typography variant="small" tone="muted">
            Drag groups to reorder · drag requirements within or across groups · edit
            name & description with the pencil. Undo with Ctrl/⌘Z.
          </Typography>
          <div className="h-[min(55vh,480px)] overflow-hidden border border-neutral-200">
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
      </div>
    </Modal>
  )
}
