import { redirect } from 'next/navigation'
import { ACCOUNT_ROUTES } from '@/modules/auth/lib/routes'

export default function AccountPage() {
  redirect(ACCOUNT_ROUTES.profile)
}
