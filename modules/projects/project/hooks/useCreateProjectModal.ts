'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as projectsApi from '../api/projects.api'
import { projectCodeFromName } from '../model/project'
import type { CreateProjectModalProps } from '../model/project'

export function useCreateProjectModal({
  workspaceId,
  open,
  onClose,
  onSuccess,
}: CreateProjectModalProps) {
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    setName('')
    setCode('')
    setDescription('')
  }, [open])

  const handleNameChange = useCallback((value: string) => {
    setName(value)
    setCode((prev) => {
      // Only auto-fill code while it still matches the previous auto value / empty
      if (!prev || prev === projectCodeFromName(name)) {
        return projectCodeFromName(value)
      }
      return prev
    })
  }, [name])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      const trimmedName = name.trim()
      const trimmedCode = (code.trim() || projectCodeFromName(trimmedName)).trim()
      if (!trimmedName || !trimmedCode) return
      setLoading(true)
      try {
        const project = await projectsApi.createProject({
          workspaceId,
          code: trimmedCode,
          name: trimmedName,
          description: description.trim() || undefined,
        })
        toast.success('Project created')
        onSuccess(project.id)
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.problem.detail
            : err instanceof Error
              ? err.message
              : 'Failed to create project'
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [name, code, description, workspaceId, onSuccess]
  )

  return {
    name,
    setName: handleNameChange,
    code,
    setCode,
    description,
    setDescription,
    loading,
    handleSubmit,
    onClose,
  }
}
