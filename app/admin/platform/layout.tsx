'use client'

import { PlatformReliabilityLayout } from '@/modules/admin/platform-reliability/presentation/ui/PlatformReliabilityLayout'

export default function AdminPlatformLayout({ children }: { children: React.ReactNode }) {
  return <PlatformReliabilityLayout>{children}</PlatformReliabilityLayout>
}
