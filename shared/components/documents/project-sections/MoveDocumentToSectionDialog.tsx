'use client'

import { useEffect, useState } from 'react'
import { Modal, Select, Typography } from '@/shared/ui'
import type { ProjectSection } from '@/types/project-section'
import { UNSECTIONED_SECTION_KEY } from '@/types/project-section'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface MoveDocumentToSectionDialogProps {
  open: boolean
  onClose: () => void
  sections: ProjectSection[]
  documentTitle?: string
  currentSectionId?: string | null
  onMove: (sectionId: string | null) => Promise<void>
}

export function MoveDocumentToSectionDialog({
  open,
  onClose,
  sections,
  documentTitle,
  currentSectionId,
  onMove,
}: MoveDocumentToSectionDialogProps) {
  const [sectionId, setSectionId] = useState<string>(UNSECTIONED_SECTION_KEY)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (open) setSectionId(currentSectionId ?? UNSECTIONED_SECTION_KEY)
  }, [open, currentSectionId])

  const options = [
    { value: UNSECTIONED_SECTION_KEY, label: 'Unsectioned' },
    ...sections.map((s) => ({ value: s.id, label: s.title })),
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      await onMove(sectionId === UNSECTIONED_SECTION_KEY ? null : sectionId)
      toast.success('Document moved')
      onClose()
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.problem.detail : err instanceof Error ? err.message : 'Failed to move document'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Move to section"
      size="sm"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Move', onClick: handleSubmit, variant: 'primary', loading },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {documentTitle && (
          <Typography variant="small" tone="muted">
            Move &ldquo;{documentTitle}&rdquo; to a section.
          </Typography>
        )}
        <div>
          <Typography variant="small" weight="medium" className="mb-1 block">
            Section
          </Typography>
          <Select
            value={sectionId}
            onValueChange={(v: string) => setSectionId(v)}
            options={options}
          />
        </div>
      </form>
    </Modal>
  )
}
