import { redirect } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

export default function AdminAiBudgetsLegacyPage() {
  redirect(ADMIN_ROUTES.aiControlUsagePolicies)
}
