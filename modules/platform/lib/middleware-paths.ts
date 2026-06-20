import { middlewareConfig } from '@/config/middleware'

type PathPrefixes = readonly string[]

function matchesPrefix(pathname: string, prefixes: PathPrefixes): boolean {
  return prefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export function isMiddlewarePublicPath(
  pathname: string,
  prefixes: PathPrefixes = middlewareConfig.publicPrefixes
): boolean {
  return matchesPrefix(pathname, prefixes)
}

export function isMiddlewareProtectedPath(
  pathname: string,
  prefixes: PathPrefixes = middlewareConfig.protectedPrefixes
): boolean {
  return matchesPrefix(pathname, prefixes)
}

export function isMiddlewareAuthEntryPath(
  pathname: string,
  paths: PathPrefixes = middlewareConfig.authEntryPaths
): boolean {
  return matchesPrefix(pathname, paths)
}
