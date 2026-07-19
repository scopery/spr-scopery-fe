/**
 * Routes that prefer a compact/collapsed sidebar (full-screen workbench).
 * User can still pin the sidebar expanded.
 */
export function isWorkbenchPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false
  return (
    /\/projects\/[^/]+\/timeline(?:\/|$)/.test(pathname) ||
    /\/projects\/[^/]+\/wbs(?:\/|$)/.test(pathname) ||
    /\/projects\/[^/]+\/schedule(?:\/|$)/.test(pathname) ||
    /\/projects\/[^/]+\/meetings(?:\/|$)/.test(pathname) ||
    /\/documents\/[^/]+/.test(pathname) ||
    /\/forms\/[^/]+(?:\/|$)/.test(pathname) ||
    /\/builder(?:\/|$)/.test(pathname) ||
    /\/email-templates(?:\/|$)/.test(pathname) ||
    /\/config\/forms\/[^/]+/.test(pathname)
  )
}
