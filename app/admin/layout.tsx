'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { ROUTES } from '@/constants/routes'
import { ContentLoader } from '@/shared/ui'
import { AuthGuard } from '@/shared/components/guards'
import { AdminShell } from '@/shared/components/layout/AdminShell'
import { toast } from 'sonner'

/**
 * Admin route guard: only profile.role === 'admin' can access.
 * Non-admin → 403 → redirect home + toast.
 */
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { profile, bootstrapStatus } = useAuth()

  useEffect(() => {
    if (bootstrapStatus === 'loading') return
    if (profile?.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này.')
      router.replace(profile?.default_org_id ? ROUTES.org.projects(profile.default_org_id) : '/')
    }
  }, [profile?.role, profile?.default_org_id, router])

  if (bootstrapStatus === 'loading' || profile?.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <ContentLoader variant="easeOut" className="w-20" />
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
