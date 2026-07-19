'use client'

import { useAuthorizationBatch } from './useAuthorizationBatch'
import { PLATFORM_ADMIN_ENTRY_CHECKS } from '../lib/authorization-checks'

/**
 * Whether the current user may enter the platform Admin shell.
 * Based on GLOBAL permission checks — not SUPER_ADMIN role.
 */
export function usePlatformAdminAccess(options?: { enabled?: boolean }) {
  const { anyAllowed, loading, error, isAllowed, results, refetch } = useAuthorizationBatch(
    PLATFORM_ADMIN_ENTRY_CHECKS,
    options
  )

  return {
    canAccessAdmin: anyAllowed,
    loading,
    error,
    isAllowed,
    results,
    refetch,
  }
}
