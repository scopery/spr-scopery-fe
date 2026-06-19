import { AuthGuard } from '@/modules/platform'

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard>{children}</AuthGuard>
}
