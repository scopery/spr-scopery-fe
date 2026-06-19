'use client'

import { Modal, Input, Typography, Select } from '@/shared/ui'
import { useCreateProjectModal } from '@/modules/projects'
import type { CreateProjectModalProps } from '@/modules/projects'

export function CreateProjectModal({ orgId, open, onClose, onSuccess }: CreateProjectModalProps) {
  const {
    name,
    setName,
    description,
    setDescription,
    templateId,
    setTemplateId,
    templateOptions,
    loading,
    templatesLoading,
    handleSubmit,
  } = useCreateProjectModal({ orgId, open, onClose, onSuccess })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Create project"
      size="md"
      actions={[
        { label: 'Cancel', onClick: onClose, variant: 'ghost' },
        { label: 'Create', onClick: handleSubmit, variant: 'primary', loading },
      ]}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Project name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Acme Scoping"
          fullWidth
        />
        <Input
          label="Description (optional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Brief description"
          fullWidth
        />
        <div>
          <label className="mb-1 block text-sm text-neutral-700">Template (required)</label>
          {templatesLoading ? (
            <Typography variant="small" tone="muted">
              Loading templates…
            </Typography>
          ) : (
            <Select
              options={templateOptions}
              value={templateId}
              onValueChange={setTemplateId}
              placeholder="Select a template"
              size="md"
              disabled={templateOptions.length === 0}
              className="w-full"
            />
          )}
        </div>
      </form>
    </Modal>
  )
}
