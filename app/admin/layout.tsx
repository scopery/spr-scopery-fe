'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/modules/auth/auth/context/AuthContext'
import { usePlatformAdminAccess } from '@/modules/auth/iam/hooks/usePlatformAdminAccess'
import { ROUTES } from '@/constants/routes'
import { ContentLoader } from '@/shared/ui'
import { AuthGuard } from '@/modules/platform/guards/ui/AuthGuard'
import { AdminShell } from '@/modules/platform/layout/ui/AdminShell'
import { toast } from 'sonner'

/**
 * Admin route guard: GLOBAL permission check-batch (not SUPER_ADMIN role).
 * No matching SYSTEM_* permission → redirect home + toast.
 */
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile, bootstrapStatus } = useAuth()
  const { canAccessAdmin, loading: authzLoading } = usePlatformAdminAccess({
    enabled: bootstrapStatus === 'ready' || bootstrapStatus === 'needs_onboarding',
  })

  const waiting =
    bootstrapStatus === 'loading' ||
    ((bootstrapStatus === 'ready' || bootstrapStatus === 'needs_onboarding') && authzLoading)

  useEffect(() => {
    if (waiting) return
    if (bootstrapStatus !== 'ready' && bootstrapStatus !== 'needs_onboarding') return
    if (!canAccessAdmin) {
      toast.error('Bạn không có quyền truy cập trang này.')
      router.replace(
        profile?.default_org_id ? ROUTES.workspace.projects(profile.default_org_id) : '/'
      )
    }
  }, [waiting, bootstrapStatus, canAccessAdmin, profile?.default_org_id, router])

  if (waiting || !canAccessAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ContentLoader />
      </div>
    )
  }

  return <AdminShell>{children}</AdminShell>
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </AuthGuard>
  )
}
