import { redirect } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

/** @deprecated Alias — prefer /admin/platform/audit-events */
export default function AdminIamAuditLogRedirectPage() {
  redirect(ADMIN_ROUTES.platformAuditEvents)
}
