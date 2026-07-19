'use client'

import { useCallback, useEffect, useState } from 'react'
import * as authSessionApi from '../../../auth/api/auth-session.api'
import type { ChangePasswordPayload } from '../../../auth/domain/model/auth-session'
import * as iamMeApi from '@/modules/auth/iam/api/me.api'
import type { IamMe } from '@/modules/auth/iam/model/interfaces/me'

export function useAccountSecurity() {
  const [changing, setChanging] = useState(false)
  const [revoking, setRevoking] = useState(false)
  const [me, setMe] = useState<IamMe | null>(null)
  const [meLoading, setMeLoading] = useState(true)

  const loadMe = useCallback(async () => {
    setMeLoading(true)
    try {
      const data = await iamMeApi.getMe()
      setMe(data)
    } catch {
      setMe(null)
    } finally {
      setMeLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadMe()
  }, [loadMe])

  const changePassword = useCallback(async (payload: ChangePasswordPayload) => {
    setChanging(true)
    try {
      await authSessionApi.changePassword(payload)
      await loadMe()
    } finally {
      setChanging(false)
    }
  }, [loadMe])

  const revokeAllSessions = useCallback(async () => {
    setRevoking(true)
    try {
      await authSessionApi.revokeAllSessions()
    } finally {
      setRevoking(false)
    }
  }, [])

  return { changing, revoking, changePassword, revokeAllSessions, me, meLoading, refetchMe: loadMe }
}
