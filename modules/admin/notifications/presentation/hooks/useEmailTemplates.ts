'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import * as notificationsApi from '../../infrastructure/api/notifications.api'
import type {
  EmailTemplate,
  EmailTemplateVersion,
  EmailRule,
  EmailDelivery,
  EmailOutbox,
  SearchEmailTemplatesParams,
  SearchEmailRulesParams,
  SearchEmailDeliveriesParams,
  SearchEmailOutboxParams,
} from '../../domain/model/notification'

export function useEmailTemplates(params?: SearchEmailTemplatesParams) {
  const [items, setItems] = useState<EmailTemplate[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await notificationsApi.searchEmailTemplates(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load email templates')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useEmailTemplateVersions(templateId: string | null) {
  const [items, setItems] = useState<EmailTemplateVersion[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    if (!templateId) return
    setLoading(true)
    setError(null)
    try {
      const res = await notificationsApi.listEmailTemplateVersions(templateId)
      setItems(res)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load template versions')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    void load()
  }, [load])

  return { items, loading, error, refetch: load }
}

export function useEmailRules(params?: SearchEmailRulesParams) {
  const [items, setItems] = useState<EmailRule[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await notificationsApi.searchEmailRules(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load email rules')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useEmailDeliveries(params?: SearchEmailDeliveriesParams) {
  const [items, setItems] = useState<EmailDelivery[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await notificationsApi.searchEmailDeliveries(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load email deliveries')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}

export function useEmailOutbox(params?: SearchEmailOutboxParams) {
  const [items, setItems] = useState<EmailOutbox[]>([])
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await notificationsApi.searchEmailOutbox(params)
      setItems(res.items)
      setTotalElements(res.totalElements)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load email outbox')
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    void load()
  }, [load])

  return { items, totalElements, loading, error, refetch: load }
}
