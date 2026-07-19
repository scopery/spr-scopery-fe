import { redirect } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export default function AdminPlatformIndexPage() {
  redirect(ADMIN_ROUTES.platformOverview)
}
