'use client'

import { useCallback, useEffect, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import { toast } from 'sonner'
import * as sessionsApi from '../api/sessions.api'
import type { CreateSessionModalProps } from '../model/session'

export function useCreateSessionModal({
  orgId,
  projectId,
  open,
  onClose,
  onSuccess,
}: CreateSessionModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) setName('')
  }, [open])

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!name.trim()) return
      setLoading(true)
      try {
        const session = await sessionsApi.createSession(orgId, projectId, { name: name.trim() })
        toast.success('Session created')
        setName('')
        onSuccess(session.id)
      } catch (err) {
        const msg =
          err instanceof ApiError
            ? err.problem.detail
            : err instanceof Error
              ? err.message
              : 'Failed to create session'
        toast.error(msg)
      } finally {
        setLoading(false)
      }
    },
    [name, orgId, projectId, onSuccess]
  )

  return { name, setName, loading, handleSubmit, onClose }
}
