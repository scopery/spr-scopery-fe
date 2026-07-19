'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { clearSessionStorage, getSessionFromCookie } from '@/shared/lib/apiClient'
import * as authApi from '../api/auth.api'
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  Profile,
  BootstrapStatus,
} from '../model/auth'
import {
  enrichWorkspacesWithOrgNames,
  getWorkspaceContext,
  listAvailableWorkspaces,
  switchWorkspace as switchWorkspaceApi,
} from '@/modules/auth/workspace-context'
import type {
  WorkspaceContextResponse,
  WorkspaceListItem,
} from '@/modules/auth/workspace-context'
import { ROUTES } from '@/constants/routes'
import { ApiError } from '@/shared/lib/api-types'
import { userHasSuperAdminRole } from '@/modules/auth/iam/api/iam.api'
import { buildSessionProfile } from '../lib/session-profile'

function readSession(): AuthSession | null {
  const raw = getSessionFromCookie()
  const user = raw?.user as
    | { id?: string; username?: string; email?: string; fullName?: string }
    | undefined
  if (!user?.id) return null
  return {
    user: {
      id: user.id,
      username: user.username ?? '',
      email: user.email ?? '',
      fullName: user.fullName,
    },
    session: { access_token: '' },
  }
}

type AuthContextValue = {
  session: AuthSession | null
  profile: Profile | null
  isSuperAdmin: boolean
  workspaces: WorkspaceListItem[]
  currentWorkspaceId: string | null
  workspaceContext: WorkspaceContextResponse | null
  bootstrapStatus: BootstrapStatus
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  switchWorkspace: (workspaceId: string) => Promise<void>
  refreshBootstrap: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const PUBLIC_PATHS = [ROUTES.auth.login, ROUTES.auth.register, ROUTES.auth.callback]
const SUSPENDED_PATH = ROUTES.suspended
const ONBOARDING_PATH = ROUTES.onboarding

function isPublicPath(path: string): boolean {
  return PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'))
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [session, setSession] = useState<AuthSession | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [workspaces, setWorkspaces] = useState<WorkspaceListItem[]>([])
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null)
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContextResponse | null>(null)
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>('loading')

  const runBootstrap = useCallback(async () => {
    const sess = getSessionFromCookie()
    const userId = (sess?.user as { id?: string })?.id
    if (!userId) {
      setSession(null)
      setBootstrapStatus('needs_login')
      setProfile(null)
      setIsSuperAdmin(false)
      setWorkspaces([])
      setCurrentWorkspaceId(null)
      setWorkspaceContext(null)
      return
    }

    const currentSession = readSession()
    setSession(currentSession)

    let superAdmin = false
    try {
      superAdmin = await userHasSuperAdminRole(userId)
    } catch {
      superAdmin = false
    }
    setIsSuperAdmin(superAdmin)

    try {
      const [ctx, available] = await Promise.all([
        getWorkspaceContext(),
        listAvailableWorkspaces(),
      ])

      if (currentSession) {
        setProfile(buildSessionProfile(currentSession, superAdmin, ctx.currentWorkspaceId))
      }

      if (!ctx.currentWorkspaceId) {
        setBootstrapStatus('needs_onboarding')
        setWorkspaces([])
        setCurrentWorkspaceId(null)
        setWorkspaceContext(ctx)
        return
      }

      const enriched = await enrichWorkspacesWithOrgNames(available)
      setWorkspaces(enriched)
      setCurrentWorkspaceId(ctx.currentWorkspaceId)
      setWorkspaceContext(ctx)
      setBootstrapStatus('ready')
    } catch (err) {
      if (err instanceof ApiError && err.isAuthError) {
        clearSessionStorage()
        setSession(null)
        setProfile(null)
        setIsSuperAdmin(false)
        setWorkspaces([])
        setCurrentWorkspaceId(null)
        setWorkspaceContext(null)
        setBootstrapStatus('needs_login')
        void import('@/shared/lib/redirectToLogin').then(({ redirectToLogin }) =>
          redirectToLogin({ skipIfOnAuthPage: true })
        )
      } else {
        if (currentSession) {
          setProfile(buildSessionProfile(currentSession, superAdmin, null))
        }
        setBootstrapStatus('needs_onboarding')
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[auth] bootstrap failed (non-auth)', err)
        }
      }
    }
  }, [])

  useEffect(() => {
    setSession(readSession())
    runBootstrap()
  }, [runBootstrap])

  const login = useCallback(
    async (payload: LoginPayload) => {
      const next = await authApi.login(payload)
      setSession(next)
      await runBootstrap()
    },
    [runBootstrap]
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const next = await authApi.register(payload)
      setSession(next)
      await runBootstrap()
    },
    [runBootstrap]
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    setSession(null)
    setProfile(null)
    setIsSuperAdmin(false)
    setWorkspaces([])
    setCurrentWorkspaceId(null)
    setWorkspaceContext(null)
    setBootstrapStatus('needs_login')
  }, [])

  const switchWorkspace = useCallback(async (workspaceId: string) => {
    const ctx = await switchWorkspaceApi(workspaceId)
    setCurrentWorkspaceId(ctx.currentWorkspaceId)
    setWorkspaceContext(ctx)
    setProfile((prev) =>
      prev ? { ...prev, default_org_id: ctx.currentWorkspaceId } : prev
    )
    setWorkspaces((prev) =>
      prev.map((w) =>
        w.id === workspaceId
          ? {
              ...w,
              name: ctx.currentWorkspaceName ?? w.name,
              code: ctx.currentWorkspaceCode ?? w.code,
            }
          : w
      )
    )
  }, [])

  const refreshBootstrap = useCallback(async () => {
    setBootstrapStatus('loading')
    await runBootstrap()
  }, [runBootstrap])

  useEffect(() => {
    if (isPublicPath(pathname ?? '')) {
      if (bootstrapStatus === 'ready' && currentWorkspaceId) {
        router.replace(ROUTES.workspace.projects(currentWorkspaceId))
      } else if (bootstrapStatus === 'ready') {
        router.replace(ONBOARDING_PATH)
      } else if (bootstrapStatus === 'needs_onboarding') {
        router.replace(ONBOARDING_PATH)
      } else if (bootstrapStatus === 'suspended') {
        router.replace(SUSPENDED_PATH)
      }
      return
    }

    switch (bootstrapStatus) {
      case 'needs_login':
        if (pathname !== SUSPENDED_PATH && !pathname?.startsWith('/invites/')) {
          router.replace(ROUTES.auth.login)
        }
        break
      case 'suspended':
        router.replace(SUSPENDED_PATH)
        break
      case 'needs_onboarding':
        if (
          !pathname?.startsWith(ONBOARDING_PATH) &&
          !(isSuperAdmin && pathname?.startsWith('/admin'))
        ) {
          router.replace(ONBOARDING_PATH)
        }
        break
      case 'ready': {
        const workspaceId = currentWorkspaceId ?? workspaces[0]?.id
        if (!workspaceId) break
        if (
          pathname === '/' ||
          pathname === '' ||
          pathname?.startsWith(ONBOARDING_PATH)
        ) {
          router.replace(ROUTES.workspace.projects(workspaceId))
        }
        break
      }
      default:
        break
    }
  }, [bootstrapStatus, pathname, router, currentWorkspaceId, workspaces, isSuperAdmin])

  const value = useMemo(
    () => ({
      session,
      profile,
      isSuperAdmin,
      workspaces,
      currentWorkspaceId,
      workspaceContext,
      bootstrapStatus,
      login,
      register,
      logout,
      switchWorkspace,
      refreshBootstrap,
    }),
    [
      session,
      profile,
      isSuperAdmin,
      workspaces,
      currentWorkspaceId,
      workspaceContext,
      bootstrapStatus,
      login,
      register,
      logout,
      switchWorkspace,
      refreshBootstrap,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
