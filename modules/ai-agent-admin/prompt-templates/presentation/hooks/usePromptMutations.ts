'use client'

import { useCallback, useState } from 'react'
import { toast } from 'sonner'
import * as promptsApi from '../../infrastructure/api/prompts.api'
import type {
  AiPromptTemplate,
  CreateAiPromptTemplatePayload,
  UpdateAiPromptTemplatePayload,
} from '../../domain/model/prompt-template'
import type {
  AiPromptVersion,
  CreateAiPromptVersionPayload,
  UpdateAiPromptVersionPayload,
} from '../../domain/model/prompt-version'

export function usePromptTemplateMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiPromptTemplatePayload): Promise<AiPromptTemplate> => {
      setSaving(true)
      try {
        const created = await promptsApi.createPromptTemplate(body)
        toast.success('Template created')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiPromptTemplatePayload): Promise<AiPromptTemplate> => {
      setSaving(true)
      try {
        const updated = await promptsApi.updatePromptTemplate(id, body)
        toast.success('Template updated')
        onSuccess?.()
        return updated
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const activate = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await promptsApi.activatePromptTemplate(id)
        toast.success('Template activated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const deactivate = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await promptsApi.deactivatePromptTemplate(id)
        toast.success('Template deactivated')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, activate, deactivate }
}

export function usePromptVersionMutations(onSuccess?: () => void) {
  const [saving, setSaving] = useState(false)

  const create = useCallback(
    async (body: CreateAiPromptVersionPayload): Promise<AiPromptVersion> => {
      setSaving(true)
      try {
        const created = await promptsApi.createPromptVersion(body)
        toast.success('Draft version created')
        onSuccess?.()
        return created
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const update = useCallback(
    async (id: string, body: UpdateAiPromptVersionPayload): Promise<AiPromptVersion> => {
      setSaving(true)
      try {
        const updated = await promptsApi.updatePromptVersion(id, body)
        toast.success('Version saved')
        onSuccess?.()
        return updated
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const activate = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await promptsApi.activatePromptVersion(id)
        toast.success('Version activated (previous ACTIVE archived)')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  const archive = useCallback(
    async (id: string) => {
      setSaving(true)
      try {
        await promptsApi.archivePromptVersion(id)
        toast.success('Version archived')
        onSuccess?.()
      } finally {
        setSaving(false)
      }
    },
    [onSuccess]
  )

  return { saving, create, update, activate, archive }
}
