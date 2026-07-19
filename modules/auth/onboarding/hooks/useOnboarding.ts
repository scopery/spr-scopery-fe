'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/shared/lib/api-types'
import { ensureCsrfToken } from '@/shared/lib/apiClient'
import { redirectToLogin } from '@/shared/lib/redirectToLogin'
import { useAuth } from '../../auth/context/AuthContext'
import {
  getOnboardingStatus,
  startOnboarding,
  chooseOnboardingOption,
  createWorkspaceOnboarding,
  acceptOnboardingInvitation,
  resetOnboardingChoice,
} from '../api/onboarding.api'
import type {
  WorkspaceOnboardingStatusResponse,
  WorkspaceOnboardingOption,
  CreateWorkspacePayload,
} from '../model'

function logOnboardingError(action: string, err: unknown) {
  if (process.env.NODE_ENV === 'production') return
  if (err instanceof ApiError) {
    console.warn(`[onboarding] ${action} failed`, {
      status: err.status,
      detail: err.problem.detail,
      code: err.problem.code,
    })
    return
  }
  console.warn(`[onboarding] ${action} failed`, err)
}

function isAuthFailure(err: unknown): boolean {
  return err instanceof ApiError && err.isAuthError
}

async function redirectIfUnauthenticated(err: unknown): Promise<boolean> {
  if (!isAuthFailure(err)) return false
  await redirectToLogin({ returnPath: '/onboarding' })
  return true
}

function needsOnboardingRecovery(res: WorkspaceOnboardingStatusResponse): boolean {
  return (
    res.status === 'CANCELLED' ||
    res.status === 'FAILED' ||
    res.status === 'WAITING_FOR_APPROVAL' ||
    res.currentStep === 'CANCELLED' ||
    res.currentStep === 'FAILED' ||
    res.currentStep === 'WAITING_JOIN_APPROVAL' ||
    res.currentStep === 'REQUEST_JOIN_WORKSPACE'
  )
}

async function normalizeStatus(
  res: WorkspaceOnboardingStatusResponse
): Promise<WorkspaceOnboardingStatusResponse> {
  if (!needsOnboardingRecovery(res)) return res
  await ensureCsrfToken()
  return resetOnboardingChoice()
}

export function useOnboarding() {
  const { refreshBootstrap, bootstrapStatus, session } = useAuth()
  const [status, setStatus] = useState<WorkspaceOnboardingStatusResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const startedRef = useRef(false)

  const authReady = bootstrapStatus === 'needs_onboarding' && session != null

  const applyStatus = useCallback(
    async (res: WorkspaceOnboardingStatusResponse) => {
      const next = await normalizeStatus(res)
      setStatus(next)
      if (next.status === 'COMPLETED') {
        try {
          await refreshBootstrap()
        } catch (err) {
          logOnboardingError('refreshBootstrap', err)
          if (await redirectIfUnauthenticated(err)) return next
          setError(
            err instanceof ApiError
              ? err.problem.detail
              : 'Joined workspace but failed to load your session. Please refresh the page.'
          )
          throw err
        }
      }
      return next
    },
    [refreshBootstrap]
  )

  const loadStatus = useCallback(async () => {
    try {
      const res = await getOnboardingStatus()
      return await applyStatus(res)
    } catch (err) {
      logOnboardingError('status', err)
      if (await redirectIfUnauthenticated(err)) return null
      setError(err instanceof ApiError ? err.problem.detail : 'Failed to load onboarding status')
      throw err
    } finally {
      setLoading(false)
    }
  }, [applyStatus])

  useEffect(() => {
    if (bootstrapStatus === 'needs_login') {
      setLoading(false)
      void redirectToLogin({ returnPath: '/onboarding' })
      return
    }
    if (!authReady) return
    if (startedRef.current) return
    startedRef.current = true

    async function bootstrapOnboarding() {
      setLoading(true)
      setError(null)

      try {
        await ensureCsrfToken()
        await getOnboardingStatus()

        try {
          await applyStatus(await startOnboarding())
        } catch (startErr) {
          if (await redirectIfUnauthenticated(startErr)) return
          if (startErr instanceof ApiError && startErr.status === 409) {
            await loadStatus()
            return
          }
          throw startErr
        }
      } catch (err) {
        logOnboardingError('bootstrap', err)
        if (await redirectIfUnauthenticated(err)) return
        if (err instanceof ApiError) {
          setError(err.problem.detail)
        } else {
          setError('Failed to load onboarding')
        }
      } finally {
        setLoading(false)
      }
    }

    void bootstrapOnboarding()
  }, [applyStatus, authReady, bootstrapStatus, loadStatus])

  const runAction = useCallback(
    async (fn: () => Promise<WorkspaceOnboardingStatusResponse>) => {
      if (!authReady) return
      setActionLoading(true)
      setError(null)
      try {
        await ensureCsrfToken()
        await applyStatus(await fn())
      } catch (err) {
        if (await redirectIfUnauthenticated(err)) return
        const msg =
          err instanceof ApiError
            ? err.problem.detail
            : err instanceof Error
              ? err.message
              : 'Something went wrong'
        setError(msg)
      } finally {
        setActionLoading(false)
      }
    },
    [applyStatus, authReady]
  )

  const chooseOption = useCallback(
    (option: WorkspaceOnboardingOption) =>
      runAction(() => chooseOnboardingOption({ option })),
    [runAction]
  )

  const createWorkspace = useCallback(
    (payload: CreateWorkspacePayload) => runAction(() => createWorkspaceOnboarding(payload)),
    [runAction]
  )

  const acceptInvitation = useCallback(
    (code: string) => runAction(() => acceptOnboardingInvitation({ code })),
    [runAction]
  )

  const resetChoice = useCallback(() => runAction(() => resetOnboardingChoice()), [runAction])

  return {
    status,
    loading: loading || bootstrapStatus === 'loading' || bootstrapStatus === 'needs_login',
    actionLoading,
    error,
    authReady,
    chooseOption,
    createWorkspace,
    acceptInvitation,
    resetChoice,
    refetch: loadStatus,
  }
}
