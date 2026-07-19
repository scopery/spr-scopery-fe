import { AuthGuard } from '@/modules/platform/guards/ui/AuthGuard'
import { AccountShell } from '@/modules/auth/account/presentation/ui/AccountShell'

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AccountShell>{children}</AccountShell>
    </AuthGuard>
  )
}
