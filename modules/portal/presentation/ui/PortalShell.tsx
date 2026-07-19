'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { Typography } from '@/shared/ui'

export function PortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="flex items-center justify-between border-b border-neutral-200 bg-white px-lg py-md">
        <Link href="/portal/projects">
          <Typography variant="h4">Scopery Client Portal</Typography>
        </Link>
        <Link href="/portal/account" className="text-sm underline">
          Account
        </Link>
      </header>
      <main>{children}</main>
    </div>
  )
}
