'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { resolveNavCapabilityForPath } from '../lib/nav-route-capabilities'

/**
 * When capabilities are loaded and the current path requires a denied capability,
 * soft-redirect to a safe fallback (workspace projects or project overview).
 *
 * Missing keys are treated as "not resolved yet" (wait), not as deny — avoids
 * bouncing back to workspace when NAV_PROJECT is still loading after click.
 */
export function useNavCapabilityDeepLinkGuard(opts: {
  workspaceId: string
  loading: boolean
  can: (key: string) => boolean
  /** True once capabilities for the current scope/packs have been merged. */
  ready: boolean
  /** Full capability map — used to distinguish missing vs explicit false. */
  caps: Record<string, boolean>
}) {
  const { workspaceId, loading, can, ready, caps } = opts
  const pathname = usePathname()
  const router = useRouter()
  const lastRedirect = useRef<string | null>(null)

  useEffect(() => {
    if (loading || !ready) return
    const req = resolveNavCapabilityForPath(pathname, workspaceId)
    if (!req) return
    const requiredKeys = [req.key, ...(req.alternativeKeys ?? [])]
    const resolvedKeys = requiredKeys.filter((key) => key in caps)
    if (resolvedKeys.length < requiredKeys.length) return
    if (resolvedKeys.some((key) => can(key))) {
      lastRedirect.current = null
      return
    }
    if (pathname === req.fallbackHref) return
    if (lastRedirect.current === pathname) return
    lastRedirect.current = pathname
    router.replace(req.fallbackHref)
  }, [loading, ready, pathname, workspaceId, can, caps, router])
}
