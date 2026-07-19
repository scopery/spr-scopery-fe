'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as emailTemplatesApi from '../../infrastructure/api/email-templates.api'
import type { CreateEmailTemplatePayload, EmailTemplate } from '../../domain/model/email-template'

export function useEmailTemplates() {
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [actingId, setActingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    setForbidden(false)
    try {
      const res = await emailTemplatesApi.listEmailTemplates()
      setTemplates(res ?? [])
    } catch (err) {
      if (err instanceof ApiError && err.status === 403) setForbidden(true)
      setError(err instanceof Error ? err.message : 'Failed to load email templates')
      setTemplates([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const create = useCallback(async (body: CreateEmailTemplatePayload) => {
    const created = await emailTemplatesApi.createEmailTemplate(body)
    await load()
    return created
  }, [load])

  const activate = useCallback(async (templateId: string) => {
    setActingId(templateId)
    try {
      const updated = await emailTemplatesApi.activateEmailTemplate(templateId)
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? updated : t)))
      return updated
    } finally {
      setActingId(null)
    }
  }, [])

  const deactivate = useCallback(async (templateId: string) => {
    setActingId(templateId)
    try {
      const updated = await emailTemplatesApi.deactivateEmailTemplate(templateId)
      setTemplates((prev) => prev.map((t) => (t.id === templateId ? updated : t)))
      return updated
    } finally {
      setActingId(null)
    }
  }, [])

  const remove = useCallback(async (templateId: string) => {
    await emailTemplatesApi.deleteEmailTemplate(templateId)
    setTemplates((prev) => prev.filter((t) => t.id !== templateId))
  }, [])

  return { templates, loading, error, forbidden, actingId, refetch: load, create, activate, deactivate, remove }
}
