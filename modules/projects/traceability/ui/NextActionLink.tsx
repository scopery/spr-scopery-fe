'use client'

import Link from 'next/link'
import { cn } from '@/utils/cn'

interface NextActionLinkProps {
  href: string | null
  label: string
  className?: string
  onClick?: () => void
}

/** Underline text action — navigates when href is set, or runs onClick. */
export function NextActionLink({ href, label, className, onClick }: NextActionLinkProps) {
  const classes = cn(
    'text-sm font-normal text-neutral-800 underline underline-offset-2 hover:text-neutral-950',
    className
  )

  if (href) {
    return (
      <Link href={href} className={classes} onClick={(e) => e.stopPropagation()}>
        {label}
      </Link>
    )
  }

  if (onClick) {
    return (
      <button type="button" className={classes} onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}>
        {label}
      </button>
    )
  }

  return <span className="text-sm text-neutral-700">{label}</span>
}

export function functionCoverageActionHref(
  workspaceId: string,
  projectId: string,
  functionId: string,
  nextAction: string,
  routes: {
    projectFunctionalCatalog: (ws: string, p: string) => string
    projectUseCases: (ws: string, p: string) => string
  }
): string {
  const catalog = `${routes.projectFunctionalCatalog(workspaceId, projectId)}?fr=${encodeURIComponent(functionId)}`
  const useCases = `${routes.projectUseCases(workspaceId, projectId)}?functionId=${encodeURIComponent(functionId)}`
  if (nextAction.includes('Use Case')) return useCases
  return catalog
}

export function useCaseCoverageActionHref(
  workspaceId: string,
  projectId: string,
  useCaseId: string,
  nextAction: string,
  routes: { projectUseCases: (ws: string, p: string) => string },
  qualityCasesHref: (
    ws: string,
    p: string,
    opts?: { type?: 'functional' | 'nfr'; selected?: string; query?: string }
  ) => string
): string {
  const detail = `${routes.projectUseCases(workspaceId, projectId)}?useCaseId=${encodeURIComponent(useCaseId)}`
  if (nextAction.toLowerCase().includes('test')) {
    return qualityCasesHref(workspaceId, projectId, {
      type: 'functional',
      query: `useCaseId=${encodeURIComponent(useCaseId)}`,
    })
  }
  return detail
}

export function implementationActionHref(
  workspaceId: string,
  projectId: string,
  functionId: string,
  routes: {
    projectFunctionalCatalog: (ws: string, p: string) => string
    projectApplicationStructure: (ws: string, p: string) => string
  }
): string {
  return `${routes.projectFunctionalCatalog(workspaceId, projectId)}?fr=${encodeURIComponent(functionId)}`
}

export function nfrActionHref(
  workspaceId: string,
  projectId: string,
  requirementId: string,
  nextAction: string,
  routes: { projectRequirements: (ws: string, p: string) => string },
  qualityCasesHref: (
    ws: string,
    p: string,
    opts?: { type?: 'functional' | 'nfr'; selected?: string; query?: string }
  ) => string
): string {
  const req = `${routes.projectRequirements(workspaceId, projectId)}?requirementId=${encodeURIComponent(requirementId)}`
  const lower = nextAction.toLowerCase()
  if (lower.includes('verification') || lower.includes('result')) {
    return qualityCasesHref(workspaceId, projectId, {
      type: 'nfr',
      query: `requirementId=${encodeURIComponent(requirementId)}`,
    })
  }
  return req
}
