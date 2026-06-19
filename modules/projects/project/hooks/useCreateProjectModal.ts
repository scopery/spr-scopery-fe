'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as projectsApi from '../api/projects.api'
import type { CreateProjectModalProps, ProjectTemplateSelectOption } from '../model/project'

export function useCreateProjectModal({
  orgId,
  open,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [templateId, setTemplateId] = useState('')
  const [templateOptions, setTemplateOptions] = useState<ProjectTemplateSelectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [templatesLoading, setTemplatesLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setTemplatesLoading(true)
    void projectsApi
      .listPublishedTemplates()
      .then((items) => {
        setTemplateOptions(
          items.map((template) => ({
            value: template.id,
            label: `${template.name} (v${template.version})`,
          }))
        )
        if (items.length > 0) setTemplateId(items[0].id)
      })
      .finally(() => setTemplatesLoading(false))
    setName('')
    setDescription('')
  }, [open])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!name.trim() || !templateId) return
      setLoading(true)
      try {
        const project = await projectsApi.createProject(orgId, {
          name: name.trim(),
          description: description.trim() || undefined,
          template_id: templateId,
        })
        toast.success('Project created')
        onSuccess(project.id)
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.problem.code === 'template-not-published' ||
              err.problem.type?.includes('template-not-published')
              ? 'Selected template is not published. Please choose another.'
              : err.problem.detail
            : err instanceof Error
              ? err.message
              : 'Failed to create project'
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [name, description, templateId, orgId, onSuccess]
  )

  return {
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
    onClose,
  }
}
