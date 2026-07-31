'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { Link as DesignLink, Typography } from '@/shared/ui'
import { ACCOUNT_ROUTES } from '@/modules/auth/lib/routes'
import { cn } from '@/utils/cn'

const NAV_ITEMS = [
  { label: 'Profile', href: ACCOUNT_ROUTES.profile },
  { label: 'Security', href: ACCOUNT_ROUTES.security },
  { label: 'Sessions', href: ACCOUNT_ROUTES.sessions },
  { label: 'Join requests', href: ACCOUNT_ROUTES.joinRequests },
] as const

export function AccountShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-3xl flex-col gap-2 px-3 py-3 sm:flex-row sm:items-end sm:justify-between lg:px-4">
          <div>
            <Typography as="p" variant="small" tone="muted" className="mb-1">
              Account
            </Typography>
            <Typography as="h1" size="md" weight="medium">
              Personal settings
            </Typography>
          </div>
          <nav aria-label="Account navigation" className="flex gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href
              return (
                <DesignLink
                  key={item.href}
                  as={NextLink}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={cn(
                    'rounded-none border-b-2 px-3 py-2 text-sm transition-colors',
                    active
                      ? 'border-primary text-neutral-900'
                      : 'border-transparent text-neutral-600 hover:text-neutral-900'
                  )}
                >
                  {item.label}
                </DesignLink>
              )
            })}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-3 py-3 lg:px-4">{children}</main>
    </div>
  )
}
