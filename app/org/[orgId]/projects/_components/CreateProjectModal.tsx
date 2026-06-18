'use client'

import { useEffect, useState } from 'react'
import { Modal, Input, Typography, Select } from '@/shared/ui'
import * as projectService from '@/services/project.service'
import * as templateService from '@/services/template.service'
import { ApiError } from '@/types/api'
import { toast } from 'sonner'

interface CreateProjectModalProps {
  orgId: string
  open: boolean
  onClose: () => void
  onSuccess: (projectId: string) => void
}

export function CreateProjectModal({ orgId, open, onClose, onSuccess }: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templates, setTemplates] = useState<templateService.TemplateListItem[]>([])
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  useEffect(() => {
    if (open) {
      setTemplatesLoading(true)
      templateService
        .listTemplates({ status: 'published', limit: 20, offset: 0 })
        .then((res) => {
          setTemplates(res.items)
          if (res.items.length > 0 && !templateId) setTemplateId(res.items[0].id)
        })
        .finally(() => setTemplatesLoading(false))
      setName('')
      setDescription('')
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !templateId) return
    setLoading(true)
    try {
      const project = await projectService.createProject(orgId, {
        name: name.trim(),
        description: description.trim() || undefined,
        template_id: templateId,
      })
      toast.success('Project created')
      onSuccess(project.id)
    } catch (err) {
      const msg =
        err instanceof ApiError
          ? err.problem.code === 'template-not-published' || err.problem.type?.includes('template-not-published')
            ? 'Selected template is not published. Please choose another.'
            : err.problem.detail
          : err instanceof Error
            ? err.message
            : 'Failed to create project'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

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
          <label className="block text-sm text-neutral-700 mb-1">Template (required)</label>
          {templatesLoading ? (
            <Typography variant="small" tone="muted">Loading templates…</Typography>
          ) : (
            <Select
              options={templates.map((t) => ({
                value: t.id,
                label: `${t.name} (v${t.version})`,
              }))}
              value={templateId}
              onValueChange={setTemplateId}
              placeholder="Select a template"
              size="md"
              disabled={templates.length === 0}
              className="w-full"
            />
          )}
        </div>
      </form>
    </Modal>
  )
}
