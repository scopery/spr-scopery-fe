import { AuthGuard } from '@/modules/platform/guards/ui/AuthGuard'
import { OnboardingShell } from '@/modules/platform/layout/ui/OnboardingShell'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <OnboardingShell>{children}</OnboardingShell>
    </AuthGuard>
  )
}
