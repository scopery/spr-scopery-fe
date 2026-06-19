'use client'

import { useEffect, useState } from 'react'
import { Modal, Input, Textarea, Typography } from '@/shared/ui'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import type { SectionFormDialogProps } from '../model/project-sections'

export function SectionFormDialog({
  open,
  onClose,
  mode,
  section,
  onSubmit,
}: SectionFormDialogProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTitle(section?.title ?? '')
    setDescription(section?.description ?? '')
  }, [open, section])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    setLoading(true)
    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim() || null,
      })
      onClose()
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to save section'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={mode === 'create' ? 'New section' : 'Rename section'}
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        {
          label: mode === 'create' ? 'Create' : 'Save',
          onClick: handleSubmit,
          variant: 'primary',
          loading,
        },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Typography variant="small" tone="muted">
          {mode === 'create'
            ? 'Create a section to organize project documents.'
            : 'Update the section title or description.'}
        </Typography>
        <Input
          label="Section title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Meeting Notes"
          fullWidth
        />
        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          fullWidth
        />
      </form>
    </Modal>
  )
}
