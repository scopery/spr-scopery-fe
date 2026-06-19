'use client'

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import {
  clearSessionStorage,
  getSessionFromCookie,
  setSessionStorage,
} from '@/shared/lib/apiClient'
import * as authApi from '../api/auth.api'
import * as profileApi from '@/modules/auth/profile/api/profile.api'
import * as orgApi from '@/modules/org/org/api/org.api'
import type {
  AuthSession,
  LoginPayload,
  RegisterPayload,
  Profile,
  BootstrapStatus,
} from '../model/auth'
import type { OrgListItem } from '@/modules/org/org'
import { ROUTES } from '@/constants/routes'
import { ApiError } from '@/shared/lib/api-types'

function readSession(): AuthSession | null {
  const raw = getSessionFromCookie()
  const user = raw?.user as { id?: string; email?: string } | undefined
  if (!user?.id) return null
  return {
    user: { id: user.id, email: user.email ?? '' },
    // Token is in HttpOnly cookie — not readable by JS; proxy adds Authorization header.
    session: { access_token: '' },
  }
}

type AuthContextValue = {
  session: AuthSession | null
  profile: Profile | null
  orgs: OrgListItem[]
  currentOrgId: string | null
  bootstrapStatus: BootstrapStatus
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  setCurrentOrgId: (orgId: string) => void
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
  const [orgs, setOrgs] = useState<OrgListItem[]>([])
  const [currentOrgId, setCurrentOrgIdState] = useState<string | null>(null)
  const [bootstrapStatus, setBootstrapStatus] = useState<BootstrapStatus>('loading')

  const runBootstrap = useCallback(async () => {
    const sess = getSessionFromCookie()
    const userId = (sess?.user as { id?: string })?.id
    if (!userId) {
      setBootstrapStatus('needs_login')
      setProfile(null)
      setOrgs([])
      setCurrentOrgIdState(null)
      return
    }

    try {
      const prof = await profileApi.getProfile()
      setProfile(prof)
      if (prof.status === 'suspended') {
        setBootstrapStatus('suspended')
        setOrgs([])
        setCurrentOrgIdState(null)
        return
      }

      const orgList = await orgApi.listOrgs({ limit: 20, offset: 0 })
      setOrgs(orgList.items)
      if (orgList.items.length === 0) {
        setBootstrapStatus('needs_onboarding')
        setCurrentOrgIdState(null)
        return
      }

      const defaultId = prof.default_org_id
      const validDefault = defaultId && orgList.items.some((o) => o.id === defaultId)
      const chosenId = validDefault ? defaultId : orgList.items[0].id
      setCurrentOrgIdState(chosenId)
      if (!validDefault) {
        await orgApi.setDefaultOrg(chosenId)
      }
      setBootstrapStatus('ready')
    } catch (err) {
      if (err instanceof ApiError && err.isAuthError) {
        clearSessionStorage()
        setSession(null)
        setProfile(null)
        setOrgs([])
        setCurrentOrgIdState(null)
        setBootstrapStatus('needs_login')
      } else {
        setBootstrapStatus('needs_login')
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
      setSessionStorage({
        access_token: next.session.access_token,
        refresh_token: next.session.refresh_token,
        user: next.user,
      })
      setSession(next)
      await runBootstrap()
    },
    [runBootstrap]
  )

  const register = useCallback(
    async (payload: RegisterPayload) => {
      const next = await authApi.register(payload)
      setSessionStorage({
        access_token: next.session.access_token,
        refresh_token: next.session.refresh_token,
        user: next.user,
      })
      setSession(next)
      await runBootstrap()
    },
    [runBootstrap]
  )

  const logout = useCallback(async () => {
    await authApi.logout()
    setSession(null)
    setProfile(null)
    setOrgs([])
    setCurrentOrgIdState(null)
    setBootstrapStatus('needs_login')
  }, [])

  const setCurrentOrgId = useCallback((orgId: string) => {
    setCurrentOrgIdState(orgId)
  }, [])

  const refreshBootstrap = useCallback(async () => {
    setBootstrapStatus('loading')
    await runBootstrap()
  }, [runBootstrap])

  useEffect(() => {
    if (isPublicPath(pathname ?? '')) {
      if (bootstrapStatus === 'ready' && currentOrgId) {
        router.replace(ROUTES.org.projects(currentOrgId))
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
        if (!pathname?.startsWith(ONBOARDING_PATH)) router.replace(ONBOARDING_PATH)
        break
      case 'ready':
        if (pathname === '/' || pathname === '') {
          const orgId = currentOrgId ?? orgs[0]?.id
          if (orgId) router.replace(ROUTES.org.projects(orgId))
        }
        break
      default:
        break
    }
  }, [bootstrapStatus, pathname, router, currentOrgId, orgs])

  const value = useMemo(
    () => ({
      session,
      profile,
      orgs,
      currentOrgId,
      bootstrapStatus,
      login,
      register,
      logout,
      setCurrentOrgId,
      refreshBootstrap,
    }),
    [
      session,
      profile,
      orgs,
      currentOrgId,
      bootstrapStatus,
      login,
      register,
      logout,
      setCurrentOrgId,
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
