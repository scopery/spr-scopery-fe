import { redirect } from 'next/navigation'
import { ADMIN_ROUTES } from '@/modules/admin/lib/routes'

/** Canonical audit UI lives under Platform Reliability. */
export default function AdminIamAuditRedirectPage() {
  redirect(ADMIN_ROUTES.platformAuditEvents)
}
